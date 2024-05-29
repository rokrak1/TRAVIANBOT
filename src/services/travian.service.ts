import puppeteer, { Page } from "puppeteer";
import { bypassRecaptcha } from "./utils/bypassRecaptcha";
import { login } from "./actions/login";
import { delay, parseCSV } from "../utils";
import path from "path";
import { startBuildingByPlan } from "./funcs/tasks";
import { goToClosestAdventureIfExsists, levelupHero } from "./actions/hero";
import {
  checkIfDailyQuestCompleted,
  checkIfQuestCompleted,
} from "./builder/quests";
import { clickNavigationSlot } from "./actions/clicker";
import { extendGoldPlanAndResources } from "./actions/gold";
import { LoggerLevels, createLogger, serverLogger } from "../config/logger";
import { TravianAccountInfo } from "../utils/CronManager";
import { supabase } from "../config/supabase";
import { sync } from "rimraf";
import { extendProtection } from "./actions/protection";
import { PlanSingelton } from "./utils/db";

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
  let browser;
  try {
    const bot = await fetchBotTypeAndPlan(botId);
    if (!bot) {
      await serverLogger(LoggerLevels.ERROR, "Bot configuration not found");
      throw new Error("Bot configuration not found");
    }
    const { plan, type } = bot;

    if (type === "VILLAGE_BUILDER" && !plan) {
      await serverLogger(LoggerLevels.ERROR, "Bot plan not found");
      throw new Error("Bot plan not found");
    }

    if (plan && plan?.length && type === "VILLAGE_BUILDER") {
      PlanSingelton.createInstance(botId, plan);
    }
    console.log("bot:", bot);
    // Launch Browser
    const serverArgs = process.env.DEV_MODE
      ? []
      : ["--no-zygote", "--single-process"];
    browser = await puppeteer.launch({
      ...(process.env.DEV_MODE && { headless: false }),
      userDataDir: `./user_data/${botId}`,
      args: [
        `--window-size=1280,1024`,
        `--proxy-server=${proxyDomain}`,
        "--no-sandbox",
        "--disabled-setupid-sandbox",
        // These flags are needed so there is launched only single process, otherwise application disconnects from chrome but keeps it running in the background
        ...serverArgs,
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
      try {
        await page.waitForNavigation({ waitUntil: "networkidle0" });
      } catch (e) {
        console.log("wait for navigation failed");
        await page.logger(
          LoggerLevels.ERROR,
          "waiting for navigation failed.."
        );
        return;
      }
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

    await extendProtection(page);

    // Start building by plan
    const hasFinished = await startBuildingByPlan(page, plan);

    // If there are no constructions, stop the bot
    if (hasFinished) {
      await page.logger(
        LoggerLevels.INFO,
        "There are no constructions left..."
      );
      return "TERMINATE";
    }

    // Do some random clicks to make it look more human (2 to 5 clicks)
    const randomClicks = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < randomClicks; i++) {
      await clickNavigationSlot(page);
      await delay(1100, 1900);
    }

    // Close browser
    await delay(3278, 5122);
  } catch (e) {
    await removeUserData(botId);
    await serverLogger(LoggerLevels.ERROR, `Error starting bot: ${e}`);
    console.error(e);
    // Make sure to close the browser even if there is an error
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const fetchBotTypeAndPlan = async (botId: string) => {
  console.log("botId:", botId);
  const { data: bot, error: bError } = await supabase
    .from("bots")
    .select("plan, type")
    .eq("id", botId)
    .single();
  if (bError) {
    throw bError;
  }
  return bot;
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
    await sync(userDataPath);
    console.log("Directory successfully removed");
    return { error: null, status: "200" };
  } catch (error) {
    console.error(`Failed to remove directory: ${error}`);
    await serverLogger(
      LoggerLevels.ERROR,
      `Failed to remove directory: ${error}`
    );
    return { error: error, status: "500" };
  }
};
