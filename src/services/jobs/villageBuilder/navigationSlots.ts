import { Page } from "puppeteer";
import { delay } from "../../../utils";
import { LoggerLevels } from "../../../config/logger";

export enum NavigationTypes {
  RESOURCES = "resources",
  TOWN = "town",
  MAP = "map",
  STATISTICS = "statistics",
  REPORTS = "reports",
  MESSAGES = "messages",
  ADVENTURES = "adventures",
  AUCTION = "auction",
  DAILY_QUESTS = "dailyQuests",
  QUEST_MASTER = "questmasterButton",
  HERO = "heroImageButton",
}

export const navigationSlots = {
  [NavigationTypes.RESOURCES]: async (page: Page) => {
    await page.click("#navigation .village.resourceView");
    try {
      await page.waitForSelector("#resourceFieldContainer");
    } catch (e) {
      await page.logger(
        LoggerLevels.ERROR,
        "waiting for #resourceFieldContainer failed.."
      );
      return;
    }
  },
  [NavigationTypes.TOWN]: async (page: Page) => {
    await page.click("#navigation .village.buildingView");
    try {
      await page.waitForSelector("#villageContent");
    } catch (e) {
      await page.logger(
        LoggerLevels.ERROR,
        "waiting for #villageContent failed.."
      );
      return;
    }
  },
  [NavigationTypes.MAP]: async (page: Page) => {
    try {
      await page.waitForSelector("a.map", { visible: true });
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, "waiting for a.map failed..");
      return;
    }
    await page.click("a.map");
  },
  [NavigationTypes.STATISTICS]: async (page: Page) => {
    await page.click("#navigation a.statistics");
  },
  [NavigationTypes.REPORTS]: async (page: Page) => {
    await page.click("#navigation a.reports");
  },
  [NavigationTypes.MESSAGES]: async (page: Page) => {
    await page.click("#navigation a.messages");
  },
  [NavigationTypes.DAILY_QUESTS]: async (page: Page) => {
    await page.click("#navigation a.dailyQuests");
  },
  [NavigationTypes.QUEST_MASTER]: async (page: Page) => {
    await page.click("#questmasterButton");
  },
  [NavigationTypes.ADVENTURES]: async (page: Page) => {
    await page.click("#topBarHero .adventure.green");
  },
  [NavigationTypes.AUCTION]: async (page: Page) => {
    await page.click("#topBarHero .auction.green");
  },
  [NavigationTypes.HERO]: async (page: Page) => {
    await page.click("#heroImageButton");
  },
};
