import { Page } from "puppeteer";
import { delay } from "../../utils";

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
    await page.waitForSelector("#resourceFieldContainer");
  },
  [NavigationTypes.TOWN]: async (page: Page) => {
    await page.click("#navigation .village.buildingView");
    await page.waitForSelector("#villageContent");
  },
  [NavigationTypes.MAP]: async (page: Page) => {
    await page.waitForSelector("a.map", { visible: true });
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
