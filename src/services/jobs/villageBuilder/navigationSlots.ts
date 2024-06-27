import { Page } from "puppeteer";
import { LoggerLevels } from "../../../config/logger";
import WindMouse from "../../funcs/windMouse";
import { randomBoundingBoxClickCoordinates } from "../../../utils";

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

const moveMouseAndClick = async (page: Page, selector: string, waitForSelector?: string) => {
  const mouse = WindMouse.getInstance();
  const element = await page.waitForSelector(selector);
  if (!element) {
    await page.logger(LoggerLevels.ERROR, `Element ${selector} not found`);
    return;
  }
  const bbox = await element.boundingBox();
  if (!bbox) {
    await page.logger(LoggerLevels.ERROR, `No bounding box found for ${selector}`);
    await page.click(selector);
    return;
  }
  const { x, y } = randomBoundingBoxClickCoordinates(bbox);
  await mouse.mouseMoveAndClick(page, x, y);

  if (waitForSelector) {
    try {
      await page.waitForSelector(waitForSelector);
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, `Waiting for ${waitForSelector} failed`);
      return;
    }
  }
};

export const navigationSlots = {
  [NavigationTypes.RESOURCES]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation .village.resourceView", "#resourceFieldContainer");
  },
  [NavigationTypes.TOWN]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation .village.buildingView", "#villageContent");
  },
  [NavigationTypes.MAP]: async (page: Page) => {
    await moveMouseAndClick(page, "a.map");
  },
  [NavigationTypes.STATISTICS]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation a.statistics");
  },
  [NavigationTypes.REPORTS]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation a.reports");
  },
  [NavigationTypes.MESSAGES]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation a.messages");
  },
  [NavigationTypes.DAILY_QUESTS]: async (page: Page) => {
    await moveMouseAndClick(page, "#navigation a.dailyQuests");
  },
  [NavigationTypes.QUEST_MASTER]: async (page: Page) => {
    await moveMouseAndClick(page, "#questmasterButton");
  },
  [NavigationTypes.ADVENTURES]: async (page: Page) => {
    await moveMouseAndClick(page, "#topBarHero .adventure.green");
  },
  [NavigationTypes.AUCTION]: async (page: Page) => {
    await moveMouseAndClick(page, "#topBarHero .auction.green");
  },
  [NavigationTypes.HERO]: async (page: Page) => {
    await moveMouseAndClick(page, "#heroImageButton");
  },
};
