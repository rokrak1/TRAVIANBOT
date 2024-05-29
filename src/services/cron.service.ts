import path from "path";
import { Bot } from "../controllers/cron.controller";
import {
  CronIntervals,
  CronManager,
  TravianAccountInfo,
} from "../utils/CronManager";
import { Worker } from "worker_threads";
import { LoggerLevels, serverLogger } from "../config/logger";
import { supabase } from "../config/supabase";

export const addCronJob = async (bot: Bot, options: TravianAccountInfo) => {
  const cronManager = CronManager.getInstance();
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
          worker.terminate().then(async () => {
            await serverLogger(
              LoggerLevels.SUCCESS,
              `Worker for botId ${bot.id} terminated successfully.`
            );
            console.log(`Worker for botId ${bot.id} terminated successfully.`);
          });

          if (result.result === "TERMINATE") {
            finishTravianBot(bot.id);
          }
        } else {
          console.error(
            `Error in Puppeteer task for botId ${bot.id}:`,
            result.error
          );
          worker.terminate().then(async () => {
            await serverLogger(
              LoggerLevels.ERROR,
              `Worker for botId ${bot.id} terminated after encountering an error.`
            );
            console.log(
              `Worker for botId ${bot.id} terminated after encountering an error.`
            );
          });
        }
      });

      worker.on("error", async (error) => {
        console.error("Worker error:", error);
        worker.terminate().then(async () => {
          await serverLogger(
            LoggerLevels.ERROR,
            `Worker for botId ${bot.id} terminated due to an internal error.`
          );
          console.log(
            `Worker for botId ${bot.id} terminated due to an internal error.`
          );
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
      worker.postMessage({ botId: bot.id, options });
      await serverLogger(
        LoggerLevels.INFO,
        `Cron job started for botId ${bot.id}`
      );
    },
    options
  );
};

const finishTravianBot = async (botId: string) => {
  const cronManager = CronManager.getInstance();
  const currentJob = cronManager.list()[botId];
  const { data, error } = await supabase
    .from("bots")
    .update({ force_stop_reason: "Plan finished" })
    .eq("id", currentJob.botId);

  if (error) {
    await serverLogger(
      LoggerLevels.ERROR,
      `Error updating bot in supabase: ${error}`
    );
    return;
  }
  try {
    await currentJob.cron.stop();
  } catch (e) {
    await serverLogger(LoggerLevels.ERROR, `Error stopping cron job: ${e}`);
    return;
  }

  await serverLogger(LoggerLevels.INFO, `Cron job ${botId} stopped`);
};
