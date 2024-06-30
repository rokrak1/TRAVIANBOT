import { FastifyReply, FastifyRequest } from "fastify";
import { controller, get, post } from "../decorators";
import { travianStart } from "../services/travian.service";
import { CronManager, CronIntervals } from "../utils/CronManager";
import { addCronJob, fetchBotConfigurationBasedOnType } from "../services/cron.service";
import { LoggerLevels, serverLogger } from "../config/logger";
import { BotType, travianStop } from "../services/utils/database";
import { removeUserData } from "../services/utils";

const cronManager = CronManager.getInstance();

interface StartRequestBody {
  botId: string;
  run?: boolean;
  botType: BotType;
}

@controller("/cron")
class CronController {
  @post("/start")
  async start(req: FastifyRequest, reply: FastifyReply) {
    const { botId, run, botType } = req.body as StartRequestBody;
    const botConfig = await fetchBotConfigurationBasedOnType(botId, botType);

    if (!botConfig) {
      return reply.code(500).send({ status: "Error fetching bot configuration" });
    }

    const { options, config, name, configurationId } = botConfig;

    if (!config) {
      return reply.code(500).send({ status: "No configuration found for bot" });
    }

    if (!config.interval) {
      return reply.code(500).send({ status: "No interval found for bot" });
    }

    if (process.env.DEV_MODE) {
      console.log("stating browser");
      await travianStart(botId, options, config.config);
      await serverLogger(LoggerLevels.INFO, `Cron job started for botId ${botId}`);
    } else {
      console.log("in cron job");
      await addCronJob(
        { botId, configurationId, name, interval: config.interval, botType },
        options,
        config.config || {}
      );

      if (run && !process.env.DEV_MODE) {
        setTimeout(async () => {
          await travianStart(botId, options, config.config);
        }, 0);
      }
    }

    return reply.send({
      status: `Cron job id ${botId} started with schedule ${CronIntervals[config.interval]}`,
    });
  }

  @post("/stop")
  async stop(req: FastifyRequest, reply: FastifyReply) {
    const { cronId } = req.body as { cronId: string };

    cronManager.stop(cronId);
    await serverLogger(LoggerLevels.INFO, `Cron job ${cronId} stopped`);
    reply.send({ status: `Cron job ${cronId} stopped` });
  }

  @post("/kill")
  async kill(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.body as { botId: string };

    try {
      cronManager.delete(botId);
    } catch (e) {
      console.error(e);
      await serverLogger(LoggerLevels.ERROR, `Error deleting cron job ${botId}`);
    }
    await serverLogger(LoggerLevels.INFO, `Cron job ${botId} removed`);

    // Deletes bot with configuraiton from database
    const { error: tError } = await travianStop(botId);
    if (tError) {
      await serverLogger(LoggerLevels.ERROR, `Bot (${botId}) data not wiped from supabase`);
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

    // Removes bot user_data from server
    const { error } = await removeUserData(botId);
    if (error) {
      await serverLogger(LoggerLevels.ERROR, `Bot (${botId}) user data not wiped from server`);
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

    await serverLogger(LoggerLevels.SUCCESS, `Successfully removed bot ${botId} and data wiped`);
    reply.send({
      status: `Cron job ${botId} removed, bot removed and data wiped`,
    });
  }

  @get("/status")
  async status(req: FastifyRequest, reply: FastifyReply) {
    const { cronId } = req.query as { cronId: string };

    const isRunning = cronManager.running(cronId);
    const nextDate = cronManager.nextDate(cronId);
    const lastDate = cronManager.lastDate(cronId);
    reply.send({
      lastDate,
      nextDate,
      running: isRunning,
    });
  }

  @get("/info")
  async info(req: FastifyRequest, reply: FastifyReply) {
    const { cronId } = req.query as { cronId: string };

    const job = cronManager.info(cronId);
    reply.send({ name: job.name, options: job.options });
  }

  @get("/list")
  async list(req: FastifyRequest, reply: FastifyReply) {
    const jobs = cronManager.list();
    const jobsDetails = Object.keys(jobs).map((k) => {
      const cronId = jobs[k].cronId;
      const options = { ...jobs[k].options };
      return {
        name: jobs[k].name,
        cronId: cronId,
        options,
        interval: jobs[k].interval,
      };
    });

    reply.send({ jobs: jobsDetails });
  }
}

export default CronController;
