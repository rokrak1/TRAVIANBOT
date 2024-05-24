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
import { Worker } from "worker_threads";
import path from "path";

export const cronManager = new CronManager();

interface StartRequestBody {
  options: TravianAccountInfo;
  interval: keyof typeof CronIntervals;
  botId: string;
  name: string;
}

@controller("/cron")
class CronController {
  @post("/start")
  async start(req: FastifyRequest, reply: FastifyReply) {
    const { options, interval, botId, name } = req.body as StartRequestBody;

    cronManager.add(
      name,
      botId,
      interval,
      async () => {
        const worker = new Worker(
          path.resolve(__dirname, "../worker/travianWorker.js")
        );

        worker.on("message", (result) => {
          if (result.success) {
            console.log(
              `Puppeteer task for botId ${botId} completed successfully:`,
              result.result
            );
          } else {
            console.error(
              `Error in Puppeteer task for botId ${botId}:`,
              result.error
            );
          }
        });

        worker.on("error", (error) => {
          console.error("Worker error:", error);
        });

        worker.on("exit", (code) => {
          if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
          }
        });

        // Send data to the worker to start the Puppeteer job
        worker.postMessage({ botId, options });
      },
      options
    );
    reply.send({
      status: `Cron job id ${botId} started with schedule ${CronIntervals.TWO_MINUTES}`,
    });
  }

  @post("/stop")
  async stop(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.body as { botId: string };

    cronManager.stop(botId);

    reply.send({ status: `Cron job ${botId} stopped` });
  }

  @post("/kill")
  async kill(req: FastifyRequest, reply: FastifyReply) {
    const { botId } = req.body as { botId: string };

    cronManager.delete(botId);

    // Deletes bot with configuraiton from database
    const { error: tError } = await travianStop(botId);
    if (tError) {
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

    // Removes bot user_data from server
    const { error } = await removeUserData(botId);
    if (error) {
      reply.code(500).send({
        status: `Cron job ${botId} removed, bot removed but data not wiped`,
      });
    }

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
