import { FastifyReply, FastifyRequest } from "fastify";
import { controller, get, post } from "../decorators";
import {
  removeUserData,
  travianStart,
  travianStop,
} from "../services/travian.service";
import {
  CronManager,
  CronIntervals,
  TravianAccountInfo,
} from "../utils/CronManager";
import { supabase } from "../config/supabase";
import { addCronJob } from "../services/cron.service";
import { LoggerLevels, serverLogger } from "../config/logger";

const cronManager = CronManager.getInstance();

interface StartRequestBody {
  options: TravianAccountInfo;
  interval: keyof typeof CronIntervals;
  botId: string;
  name: string;
}

interface Proxy {
  id: string;
  proxy_domain: string;
  proxy_username: string;
  proxy_password: string;
  proxy_name: string;
}

interface BotConfiguration {
  id: string;
  travian_username: string;
  travian_password: string;
  travian_domain: string;
  proxies: Proxy;
}

export interface Bot {
  id: string;
  bot_configuration: BotConfiguration;
  image: string | null;
  name: string;
  created_at: string;
  isRunning?: boolean;
  interval: string;
}

export const getSupabaseActiveJobAndStartWorkersWithCron = async () => {
  const { data, error } = await supabase
    .from("bots")
    .select("*, bot_configuration(*, proxies(*))")
    .eq("should_be_running", true);
  if (error) {
    console.error("Error fetching active jobs from supabase", error);
    return;
  }
  if (!data) {
    console.error("No active jobs found in supabase");
    return;
  }
  for (let i = 0; i < data.length; i++) {
    const bot: Bot = data[i];
    const options: TravianAccountInfo = {
      travianDomain: bot.bot_configuration.travian_domain,
      travianPassword: bot.bot_configuration.travian_password,
      travianUsername: bot.bot_configuration.travian_username,
      proxyDomain: bot.bot_configuration.proxies.proxy_domain,
      proxyPassword: bot.bot_configuration.proxies.proxy_password,
      proxyUsername: bot.bot_configuration.proxies.proxy_username,
    };
    await addCronJob(bot, options);
  }
};

@controller("/cron")
class CronController {
  @post("/start")
  async start(req: FastifyRequest, reply: FastifyReply) {
    const { options, interval, botId, name } = req.body as StartRequestBody;

    if (process.env.DEV_MODE) {
      await travianStart(botId, options);
      await serverLogger(
        LoggerLevels.INFO,
        `Cron job started for botId ${botId}`
      );
    } else {
      await addCronJob({ id: botId, name, interval } as Bot, options);
    }
    reply.send({
      status: `Cron job id ${botId} started with schedule ${CronIntervals[interval]}`,
    });
  }

  @post("/stop")
  async stop(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.body as { botId: string };

    cronManager.stop(botId);
    await serverLogger(LoggerLevels.INFO, `Cron job ${botId} stopped`);
    reply.send({ status: `Cron job ${botId} stopped` });
  }

  @post("/kill")
  async kill(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.body as { botId: string };

    try {
      cronManager.delete(botId);
    } catch (e) {
      console.error(e);
      await serverLogger(
        LoggerLevels.ERROR,
        `Error deleting cron job ${botId}`
      );
    }
    await serverLogger(LoggerLevels.INFO, `Cron job ${botId} removed`);

    // Deletes bot with configuraiton from database
    const { error: tError } = await travianStop(botId);
    if (tError) {
      await serverLogger(
        LoggerLevels.ERROR,
        `Bot (${botId}) data not wiped from supabase`
      );
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

    // Removes bot user_data from server
    const { error } = await removeUserData(botId);
    if (error) {
      await serverLogger(
        LoggerLevels.ERROR,
        `Bot (${botId}) user data not wiped from server`
      );
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

    await serverLogger(
      LoggerLevels.SUCCESS,
      `Successfully removed bot ${botId} and data wiped`
    );
    reply.send({
      status: `Cron job ${botId} removed, bot removed and data wiped`,
    });
  }

  @get("/status")
  async status(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.query as { botId: string };

    const isRunning = cronManager.running(botId);
    const nextDate = cronManager.nextDate(botId);
    const lastDate = cronManager.lastDate(botId);
    reply.send({
      lastDate,
      nextDate,
      running: isRunning,
    });
  }

  @get("/info")
  async info(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.query as { botId: string };

    const job = cronManager.info(botId);
    reply.send({ name: job.name, options: job.options });
  }

  @get("/list")
  async list(req: FastifyRequest, reply: FastifyReply) {
    const jobs = cronManager.list();
    const jobsDetails = Object.keys(jobs).map((k) => {
      const botId = jobs[k].botId;
      const options = { ...jobs[k].options };
      return {
        name: jobs[k].name,
        botId: botId,
        options,
        interval: jobs[k].interval,
      };
    });

    reply.send({ jobs: jobsDetails });
  }
}

export default CronController;
