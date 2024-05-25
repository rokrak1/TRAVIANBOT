import puppeteer, { Page } from "puppeteer";
import { bypassRecaptcha } from "./funcs/bypassRecaptcha";
import { login } from "./funcs/login";
import { delay, parseCSV } from "../utils";
import path from "path";
import { startBuildingByPlan } from "./funcs/tasks";
import { goToClosestAdventureIfExsists, levelupHero } from "./funcs/hero";
import {
  checkIfDailyQuestCompleted,
  checkIfQuestCompleted,
} from "./funcs/quests";
import { clickNavigationSlot } from "./funcs/clicker";
import { extendGoldPlanAndResources } from "./funcs/gold";
import { LoggerLevels, createLogger } from "../config/logger";
import { CronJobDetails, TravianAccountInfo } from "../utils/CronManager";
import { supabase } from "../config/supabase";
import fs from "fs";
import { cronManager } from "../controllers/cron.controller";

export const travianStart = async (
  botId: string,
  {
    travianUsername,
    travianPassword,
    travianDomain,
    proxyDomain,
    proxyUsername,
    proxyPassword,
  }: TravianAccountInfo
) => {
  try {
    // Launch Browser
    const browser = await puppeteer.launch({
      userDataDir: `./user_data/${botId}`,
      args: [
        `--window-size=1280,1024`,
        `--proxy-server=${proxyDomain}`,
        "--no-sandbox",
        "--disabled-setupid-sandbox",
      ],
      defaultViewport: {
        width: 1280,
        height: 1024,
      },
    });

    const page = await browser.newPage();

    // Create new logger based on botId
    page.logger = await createLogger(botId!);

    // Set up proxy
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });

    await page.setDefaultNavigationTimeout(0);

    // Bypass Recaptcha
    await bypassRecaptcha(page);

    // Go to domain
    await page.goto(travianDomain);

    // Check if first page is rendered
    const firstPage = await page.$("#resourceFieldContainer");
    if (!firstPage) {
      // Login
      await login(page, travianUsername, travianPassword);
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    }

    const firstStepsArray = [
      // Check if there is any adventure and start it
      goToClosestAdventureIfExsists,
      // Check daily quest and collect it
      checkIfDailyQuestCompleted,
      // Check if there is any quests completed and collect rewards
      checkIfQuestCompleted,
    ];

    // Shuffle first steps so it's not always the same
    const shuffledFirstSteps = firstStepsArray.sort(() => Math.random() - 0.5);
    for (const step of shuffledFirstSteps) {
      await step(page);
    }

    // Level up hero if possible
    await levelupHero(page);

    // Extend gold plan and resources
    await extendGoldPlanAndResources(page);

    // Start building by plan
    const plan = await parseCSV(path.join(process.cwd(), "src", "plan.csv"));
    const hasFinished = await startBuildingByPlan(page, plan);

    // If there are no constructions, stop the bot
    if (hasFinished) {
      await finishTravianBot(page, botId);
    }

    // Do some random clicks to make it look more human (2 to 5 clicks)
    const randomClicks = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < randomClicks; i++) {
      await clickNavigationSlot(page);
      await delay(1100, 1900);
    }

    // Close browser
    await delay(3278, 5122);
    await browser.close();
  } catch (e) {
    await removeUserData(botId);
    console.error(e);
  }
};

const finishTravianBot = async (page: Page, botId: string) => {
  const currentJob = cronManager.list()[botId];
  await page.logger(LoggerLevels.INFO, "There are no constructions left...");
  const { data, error } = await supabase
    .from("bot")
    .update({ force_stop_reason: "Plan finished" })
    .eq("id", currentJob.botId);
  if (error) {
    await page.logger(
      LoggerLevels.ERROR,
      "Error updating bot force_stop_reason"
    );
  }

  try {
    await currentJob.cron.stop();
  } catch (e) {
    await page.logger(LoggerLevels.ERROR, "Error stopping cron job");
    return;
  }

  await page.logger(LoggerLevels.SUCCESS, "Bot stopped. Reason: Plan finished");
};

export const travianStop = async (botId: string) => {
  try {
    const { data: bot, error: bError } = await supabase
      .from("bots")
      .select()
      .eq("id", botId)
      .single();
    if (bError) {
      throw bError;
    }

    const { data, error } = await supabase
      .from("bot_configuration")
      .delete()
      .eq("id", bot.configuration_id);
    if (error) {
      throw error;
    }
    return { error: null, status: "200" };
  } catch (err) {
    console.log(err);
    return { error: err, status: "500" };
  }
};

export const removeUserData = async (botId: string) => {
  const userDataPath = path.join(process.cwd(), "user_data", botId);
  try {
    fs.rmdirSync(userDataPath, { recursive: true });
  } catch (e) {
    console.error(e);
    return { error: e, status: "500" };
  }
  return { error: null, status: "200" };
};
