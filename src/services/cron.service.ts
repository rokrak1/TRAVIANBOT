import path from "path";
import { Bot } from "../controllers/cron.controller";
import {
  CronIntervals,
  CronManager,
  TravianAccountInfo,
} from "../utils/CronManager";
import { Worker } from "worker_threads";

export const addCronJob = async (
  cronManager: CronManager,
  bot: Bot,
  options: TravianAccountInfo
) => {
  cronManager.add(
    bot.name,
    bot.id,
    bot.interval as keyof typeof CronIntervals,
    async () => {
      const worker = new Worker(
        path.resolve(__dirname, "../worker/travianWorker.js")
      );

      worker.on("message", (result) => {
        if (result.success) {
          console.log(
            `Puppeteer task for botId ${bot.id} completed successfully:`,
            result.result
          );
        } else {
          console.error(
            `Error in Puppeteer task for botId ${bot.id}:`,
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
      worker.postMessage({ botId: bot.id, options });
    },
    options
  );
};
