import { Page } from "puppeteer";
import { CSV_ROW, delay, timeToSeconds } from "../../utils";
import { clickNavigationSlot } from "./clicker";
import { NavigationTypes } from "../slots/navigationSlots";
import { LoggerLevels } from "../../config/logger";
import { Slots } from "../slots/csvSlots";
import { upgradeFields } from "./fields_builder";
import { upgradeBuilding } from "./town_builder";

const getArrayOfConstructions = async (page: Page): Promise<number[]> => {
  const url = page.url();
  if (!url.includes("dorf1") && !url.includes("dorf2")) {
    await clickNavigationSlot(page, NavigationTypes.RESOURCES);
  }
  const isThereActiveConstruction = await page.$(".buildingList");
  //console.log("isThereActiveConstruction", !!isThereActiveConstruction);
  if (!isThereActiveConstruction) return [0, 0];

  const currentBuildingList = await page.$$(".buildingList ul li");
  const buildingListTime = [0, 0];
  try {
    for (let i = 0; i < currentBuildingList.length; i++) {
      const getTime = await currentBuildingList[i].$eval(
        ".timer",
        (el) => el?.textContent || "0"
      );
      const timeInSeconds = timeToSeconds(getTime);
      buildingListTime[i] = timeInSeconds;
    }
    return buildingListTime;
  } catch (e) {
    await page.logger(LoggerLevels.ERROR, "Error getting construction time");
    console.log("Error getting construction time", e);
    return [0, 0];
  }
};

export const startBuildingByPlan = async (page: Page, plan: CSV_ROW[]) => {
  let planIndex = 0;
  let earlyBreak = false;
  while (planIndex < plan.length) {
    await page.logger(
      LoggerLevels.INFO,
      `Starting plan: ${plan[planIndex].slot}, to level: ${plan[planIndex].level}`
    );
    const row = plan[planIndex];

    // Check if there are already 2 constructions
    const [time1, time2] = await getArrayOfConstructions(page);
    const underConstructionNumber = [time1, time2].reduce(
      (acc, curr) => (curr > 0 ? acc + 1 : acc + 0),
      0
    );
    if (time1 > 0 && time2 > 0) {
      await page.logger(LoggerLevels.INFO, "There are already 2 constructions");
      console.log("There are already 2 constructions");
      earlyBreak = true;
      break;
    }

    // Start building upgrades
    const [endLoop, freezeIndex] = await proceedWithUpgrades(
      page,
      row,
      underConstructionNumber
    );
    if (endLoop) {
      earlyBreak = true;
      break;
    }
    await delay(400, 1400);

    // Freeze index if slot should be upgraded more than 1 level
    !freezeIndex && planIndex++;
  }

  // If there are no constructions, stop the bot
  if (!earlyBreak) {
    return true;
  }
};

/**
 *  Returns [x, y]
 *  x: boolean - Should end the loop
 *  y: boolean - Is there any construction
 *
 */

const proceedWithUpgrades = async (
  page: Page,
  row: CSV_ROW,
  underConstructionNumber: number
): Promise<any[]> => {
  // RESOURCES
  if (row.slot === Slots.ALL_FIELDS) {
    return [await upgradeFields(page, row, underConstructionNumber), false];
    // TOWN
  } else {
    return await upgradeBuilding(page, row);
  }
};
