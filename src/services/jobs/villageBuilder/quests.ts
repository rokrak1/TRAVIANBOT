import { Page } from "puppeteer";
import { delay } from "../../../utils";
import { NavigationTypes } from "./navigationSlots";
import { clickNavigationSlot } from "../travianActions/clicker";
import { LoggerLevels } from "../../../config/logger";

export const checkIfDailyQuestCompleted = async (page: Page) => {
  const quest = await page.$(".dailyQuests .indicator");
  if (quest) {
    await clickNavigationSlot(page, NavigationTypes.DAILY_QUESTS);
    try {
      await page.waitForSelector(".pointsAndAchievements");
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, "waiting for daily quest failed..");
      return;
    }
    const achivements = await page.$$(".pointsAndAchievements .achievement");
    for (let achivement of achivements) {
      const isRewardReady = await achivement.$(".rewardReady");
      if (isRewardReady) {
        await achivement.click();
        await delay(623, 1120);
        const collectBtn = await page.$(".questButtons button[type='submit']");
        await collectBtn?.click();
        await page.logger(
          LoggerLevels.SUCCESS,
          "Daily quest reward collected."
        );
      }
    }
    return;
  }
  await page.logger(LoggerLevels.INFO, "No completed daily quest found.");
  console.log("No completed daily quest found.");
};

export const checkIfQuestCompleted = async (page: Page) => {
  const quest = await page.$(".bigSpeechBubble");
  if (quest) {
    await clickNavigationSlot(page, NavigationTypes.QUEST_MASTER);
    try {
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    } catch (e) {
      await page.logger(
        LoggerLevels.ERROR,
        "waiting for quest completed failed.."
      );
      return;
    }
    await takeReward(page);
    return;
  }
  await page.logger(LoggerLevels.INFO, "No completed quest found.");
  console.log("No completed quest found.");
};

const takeReward = async (page: Page) => {
  const rewards = await page.$$(".task.achieved");
  for (let i = 0; i < rewards.length; i++) {
    const collectBtn = await rewards[i].$("button.collect");
    await collectBtn?.click();
    await page.logger(LoggerLevels.SUCCESS, "Quest reward collected.");
    delay(323, 720);
  }
};
