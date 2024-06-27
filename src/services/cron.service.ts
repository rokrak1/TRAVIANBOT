import path from "path";
import { CronIntervals, CronManager, TravianBotSettings } from "../utils/CronManager";
import { Worker } from "worker_threads";
import { LoggerLevels, serverLogger } from "../config/logger";
import { supabase } from "../config/supabase";
import {
  Bot,
  BotConfiguration,
  FarmerConfiguration,
  OasisFarmerConfiguration,
  Proxy,
  VillageConfiguration,
} from "../types/main.types";
import { BotType } from "./utils/database";

export enum JobResults {
  TERMINATE = "TERMINATE",
}

interface CronJobSettings {
  botId: string;
  configurationId: string;
  name: string;
  interval: keyof typeof CronIntervals;
  botType: BotType;
}
/**
 * I fucked whole code because i reworked DB and flow poorly as fuck...
 * But its intented to stay private so no worries i guess xD
 */
export const addCronJob = async (
  cron: CronJobSettings,
  options: TravianBotSettings,
  additionalConfiguration: object
) => {
  const cronManager = CronManager.getInstance();
  cronManager.add(
    cron.name,
    cron.configurationId,
    cron.interval as keyof typeof CronIntervals,
    cron.botType,
    async () => {
      const cronId = `${cron.configurationId}_${cron.botType}`;
      const worker = new Worker(path.resolve(__dirname, "../worker/travianWorker.js"));

      worker.on("message", (result) => {
        if (result.success) {
          console.log(`Puppeteer task for configurationId ${cronId} completed successfully:`, result.result);
          worker.terminate().then(async () => {
            await serverLogger(LoggerLevels.SUCCESS, `Worker for configurationId ${cronId} terminated successfully.`);
            console.log(`Worker for configurationId ${cronId} terminated successfully.`);
          });

          if (result.result === JobResults.TERMINATE) {
            finishTravianBot(cron.botType, cronId);
          }
        } else {
          console.error(`Error in Puppeteer task for configurationId ${cronId}:`, result.error);
          worker.terminate().then(async () => {
            await serverLogger(
              LoggerLevels.ERROR,
              `Worker for configurationId ${cronId} terminated after encountering an error.`
            );
            console.log(`Worker for configurationId ${cronId} terminated after encountering an error.`);
          });
        }
      });

      worker.on("error", async (error) => {
        console.error("Worker error:", error);
        worker.terminate().then(async () => {
          await serverLogger(
            LoggerLevels.ERROR,
            `Worker for configurationId ${cronId} terminated due to an internal error.`
          );
          console.log(`Worker for configurationId ${cronId} terminated due to an internal error.`);
        });
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });

      // Send data to the worker to start the Puppeteer job
      worker.postMessage({ botId: cron.botId, options, additionalConfiguration });
      await serverLogger(LoggerLevels.INFO, `Cron job started for ${cronId}`);
    },
    options
  );
};

const getBotTypeRunningCell = (botType: BotType) => {
  switch (botType) {
    case BotType.VILLAGE_BUILDER:
      return "village_running";
    case BotType.FARMER:
      return "farmer_running";
    case BotType.OASIS_FARMER:
      return "oasis_farmer_running";
    default:
      throw new Error("Bot type not found");
  }
};

const finishTravianBot = async (botType: BotType, cronId: string) => {
  const cronManager = CronManager.getInstance();
  const currentJob = cronManager.list()[cronId];

  const cell = getBotTypeRunningCell(botType);
  const { data, error } = await supabase
    .from("bot_configuration")
    .update({ [cell]: false })
    .eq("id", currentJob.cronId);

  if (error) {
    await serverLogger(LoggerLevels.ERROR, `Error updating bot in supabase: ${error}`);
    return;
  }
  try {
    await currentJob.cron.stop();
  } catch (e) {
    await serverLogger(LoggerLevels.ERROR, `Error stopping cron job: ${e}`);
    return;
  }

  await serverLogger(LoggerLevels.INFO, `Cron job ${cronId} stopped`);
};

export const fetchProxies = async (botId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bot_proxy")
      .select("proxies(*), from, to")
      .eq("user_id", userId)
      .eq("bot_id", botId);
    if (error) {
      throw new Error("Error fetching proxies from supabase");
    }

    if (!data) {
      throw new Error("No data found for userId");
    }

    return data;
  } catch (e) {
    console.error(e);
  }
};

export interface ConfigAndRunninState {
  config: OasisFarmerConfiguration | FarmerConfiguration | VillageConfiguration | null;
  isRunning: boolean;
}

export const getAppropriateConfigurationAndRunningState = (
  botConfig: BotConfiguration,
  botType: BotType
): ConfigAndRunninState => {
  switch (botType) {
    case BotType.VILLAGE_BUILDER:
      return { config: botConfig.village_configuration, isRunning: botConfig.village_running };
    case BotType.FARMER:
      return { config: botConfig.farmer_configuration, isRunning: botConfig.farmer_running };
    case BotType.OASIS_FARMER:
      return { config: botConfig.oasis_farmer_configuration, isRunning: botConfig.oasis_farmer_running };
    default:
      throw new Error("Bot type not found");
  }
};

export const fetchBotConfigurationBasedOnType = async (botId: string, botType: BotType) => {
  try {
    const { data, error } = await supabase.from("bots").select("*, bot_configuration(*)").eq("id", botId).single();

    if (error) {
      throw new Error("Error fetching bot configuration from supabase");
    }

    if (!data) {
      throw new Error("No data found for botId");
    }

    const bot: Bot = data;

    const proxies = await fetchProxies(bot.id, bot.user_id);

    if (!proxies?.length) {
      throw new Error("No proxies found for bot");
    }

    const options: TravianBotSettings = {
      travianDomain: bot.bot_configuration.travian_domain,
      travianPassword: bot.bot_configuration.travian_password,
      travianUsername: bot.bot_configuration.travian_username,
      botType,
      configurationId: bot.configuration_id,
      villageConfiguration: bot.bot_configuration.village_configuration!,
      proxies: [
        ...proxies.map((p) => ({
          ...(p.proxies as unknown as Proxy),
          proxy_timezones: {
            from: p.from,
            to: p.to,
          },
        })),
      ],
    };

    const { config, isRunning } = await getAppropriateConfigurationAndRunningState(bot.bot_configuration, botType);
    return { options, config, isRunning, name: bot.name + "_" + botType, configurationId: bot.configuration_id };
  } catch (e) {
    console.error(e);
  }
};

export const getSupabaseActiveJobAndStartWorkersWithCron = async () => {
  try {
    const { data, error } = await supabase.from("bot").select("*, bot_configuration(*)");
    if (error) {
      throw new Error("Error fetching active jobs from supabase");
    }

    if (!data) {
      throw new Error("No active jobs found");
    }
    const bots: Bot[] = data;

    for (const bot of bots) {
      const villageConfig = await fetchBotConfigurationBasedOnType(bot.id, BotType.VILLAGE_BUILDER);
      const farmerConfig = await fetchBotConfigurationBasedOnType(bot.id, BotType.FARMER);
      const oasisConfig = await fetchBotConfigurationBasedOnType(bot.id, BotType.OASIS_FARMER);

      if (villageConfig?.isRunning) {
        await addCronJob(
          {
            botId: bot.id,
            configurationId: bot.configuration_id,
            botType: BotType.VILLAGE_BUILDER,
            name: bot.name,
            interval: villageConfig.config!.interval,
          },
          villageConfig.options,
          villageConfig!.config!.config
        );
      }

      if (farmerConfig?.isRunning) {
        await addCronJob(
          {
            botId: bot.id,
            configurationId: bot.configuration_id,
            botType: BotType.FARMER,
            name: bot.name,
            interval: farmerConfig.config!.interval,
          },
          farmerConfig.options,
          farmerConfig!.config!.config
        );
      }

      if (oasisConfig?.isRunning) {
        await addCronJob(
          {
            botId: bot.id,
            configurationId: bot.configuration_id,
            botType: BotType.OASIS_FARMER,
            name: bot.name,
            interval: oasisConfig.config!.interval,
          },
          oasisConfig.options,
          oasisConfig!.config!.config
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
};
