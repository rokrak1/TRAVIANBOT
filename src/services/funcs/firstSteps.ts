import { Page } from "puppeteer";
import { TravianAccountInfo } from "../../utils/CronManager";
import { login } from "../actions/login";
import { LoggerLevels } from "../../config/logger";
import { goToClosestAdventureIfExsists, levelupHero } from "../actions/hero";
import {
  checkIfDailyQuestCompleted,
  checkIfQuestCompleted,
} from "../builder/quests";
import { extendGoldPlanAndResources } from "../actions/gold";
import { extendProtection } from "../actions/protection";

export const firstSteps = async (
  page: Page,
  configuration: TravianAccountInfo
) => {
  const { travianDomain, travianUsername, travianPassword } = configuration;

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
      await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
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
};
