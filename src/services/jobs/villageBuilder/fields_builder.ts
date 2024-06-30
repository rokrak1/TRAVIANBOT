import { Page } from "puppeteer";
import { delay } from "../../../utils";
import { clickNavigationSlot } from "../travianActions/clicker";
import { NavigationTypes } from "./navigationSlots";
import {
  checkAllResourcesAndAddThemIfPossible,
  clickOnBuildingSlot,
  clickOnExchangeButton,
  clickOnUpgradeButton,
} from "./builder";
import { LoggerLevels } from "../../../config/logger";
import { PlanSingelton } from "../../funcs/plan";
import { PlanItem, PlanStatus } from "../../../types/main.types";
import { RSlots, getSlotClassByName } from "./resourcesSlots";

const getAllField = async (page: Page, specificField?: RSlots) => {
  // If specific field is passed, only upgrade that field
  if (specificField) {
    const fieldClass = getSlotClassByName(specificField);
    const field = await page.$(`#resourceFieldContainer a.level.${fieldClass}`);
    if (!field) {
      await page.logger(LoggerLevels.ERROR, `Field ${specificField} not found..`);
      return;
    }
    return [field];
  }

  const allFields = await page.$$("#resourceFieldContainer a.level");

  if (!allFields.length) {
    await page.logger(LoggerLevels.ERROR, "No fields found..");
    return;
  }
  return allFields;
};

export const upgradeFields = async (
  page: Page,
  row: PlanItem,
  underConstructionNumber: number,
  specificField?: RSlots
) => {
  const pageUrl = page.url();
  // Only go to town if not already in town
  if (!pageUrl.includes("dorf1")) {
    await clickNavigationSlot(page, NavigationTypes.RESOURCES);
    await delay(200, 600);
  }
  const allFields = await getAllField(page, specificField);
  if (!allFields) return;

  for (let i = 0; i < allFields.length; i++) {
    const allFields = await getAllField(page, specificField);
    if (!allFields) return;
    // End the loop if there are already 2 constructions
    if (underConstructionNumber > 1) return true;

    // TODO: Refactor this so it can be reused in building upgrades
    const isFieldUnderConstruction = await allFields[i].evaluate((el) => el.classList.contains("underConstruction"));
    const isFieldMaxLevel = await allFields[i].evaluate((el) => el.classList.contains("maxLevel"));
    const isFieldNotNow = await allFields[i].evaluate((el) => el.classList.contains("notNow"));
    const isFieldGoodToUpgrade = await allFields[i].evaluate((el) => el.classList.contains("good"));
    const buildingSlot = await allFields[i].evaluate((el) =>
      Array.from(el.classList).find((c) => c.includes("buildingSlot"))
    );

    const fieldLevel = await allFields[i].evaluate((el) => el.classList[el.classList.length - 1]);

    // Set level number and check if building is upgrading
    let fieldLevelNumber = parseInt(fieldLevel.replace("level", ""), 10);
    const isUpgrading = await allFields[i].evaluate((el) => el.querySelector("a.underConstruction "));
    fieldLevelNumber += isUpgrading ? 1 : 0;

    if (row.level > fieldLevelNumber && !isFieldUnderConstruction && !isFieldMaxLevel) {
      if (isFieldGoodToUpgrade) {
        await clickOnBuildingSlot(page, buildingSlot);
        await clickOnUpgradeButton(page);
        await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
        PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.UPGRADING);
        underConstructionNumber++;
      } else if (isFieldNotNow) {
        console.log("Field is not good to upgrade.. Checking hero resources...");
        await page.logger(LoggerLevels.INFO, "Field is not good to upgrade.. Checking hero resources...");
        await clickOnBuildingSlot(page, buildingSlot);

        // Check if there are enough resources and add them from hero if possible
        const [necessaryResources, forceUpgrade] = await checkAllResourcesAndAddThemIfPossible(
          page,
          NavigationTypes.RESOURCES
        );
        if (!necessaryResources) {
          await page.logger(LoggerLevels.INFO, "Not enough resources..");
          console.log("Not enough resources..");
          return true;
        }

        // Start building construction
        await clickOnBuildingSlot(page, buildingSlot);

        const upgradeFunc = forceUpgrade ? clickOnExchangeButton : clickOnUpgradeButton;
        await upgradeFunc(page);
        await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
        PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.UPGRADING);
        underConstructionNumber++;
        console.log("Field upgraded..");
      }
    }
  }
  if (underConstructionNumber > 1) return true;
  await page.logger(LoggerLevels.INFO, "All fields upgraded. Skipping..");
  PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.DONE);
};
export const upgradeSingleField = async (
  page: Page,
  row: PlanItem,
  underConstructionNumber: number,
  specificField?: RSlots
) => {
  const pageUrl = page.url();
  // Only go to town if not already in town
  if (!pageUrl.includes("dorf1")) {
    await clickNavigationSlot(page, NavigationTypes.RESOURCES);
    await delay(200, 600);
  }
  const allFields = await getAllField(page, specificField);
  if (!allFields) return [true, false];

  const singleField = allFields[0];

  // End the loop if there are already 2 constructions
  if (underConstructionNumber > 1) return [true, false];

  const isFieldUnderConstruction = await singleField.evaluate((el) => el.classList.contains("underConstruction"));
  const isFieldMaxLevel = await singleField.evaluate((el) => el.classList.contains("maxLevel"));
  const isFieldNotNow = await singleField.evaluate((el) => el.classList.contains("notNow"));
  const isFieldGoodToUpgrade = await singleField.evaluate((el) => el.classList.contains("good"));
  const buildingSlot = await singleField.evaluate((el) =>
    Array.from(el.classList).find((c) => c.includes("buildingSlot"))
  );

  const fieldLevel = await singleField.evaluate((el) => el.classList[el.classList.length - 1]);

  // Set level number and check if building is upgrading
  let fieldLevelNumber = parseInt(fieldLevel.replace("level", ""), 10);
  fieldLevelNumber += isFieldUnderConstruction ? 1 : 0;
  const upgradeTime = row.level - fieldLevelNumber;

  const afterUpgrade = upgradeTime - 1;

  console.log("upgradeTime", upgradeTime);
  console.log("fieldLevelNumber", fieldLevelNumber);

  if (upgradeTime && !isFieldMaxLevel) {
    if (isFieldGoodToUpgrade) {
      await clickOnBuildingSlot(page, buildingSlot);
      await clickOnUpgradeButton(page);
      await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
      PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.UPGRADING);
      underConstructionNumber++;
    } else if (isFieldNotNow) {
      console.log("Field is not good to upgrade.. Checking hero resources...");
      await page.logger(LoggerLevels.INFO, "Field is not good to upgrade.. Checking hero resources...");
      await clickOnBuildingSlot(page, buildingSlot);

      // Check if there are enough resources and add them from hero if possible
      const [necessaryResources, forceUpgrade] = await checkAllResourcesAndAddThemIfPossible(
        page,
        NavigationTypes.RESOURCES
      );
      if (!necessaryResources) {
        await page.logger(LoggerLevels.INFO, "Not enough resources..");
        console.log("Not enough resources..");
        return [true, !!afterUpgrade];
      }

      // Start building construction
      await clickOnBuildingSlot(page, buildingSlot);

      const upgradeFunc = forceUpgrade ? clickOnExchangeButton : clickOnUpgradeButton;
      await upgradeFunc(page);
      await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
      PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.UPGRADING);
      underConstructionNumber++;
      console.log("Field upgraded..");
    }
  } else {
    await page.logger(LoggerLevels.INFO, "All fields upgraded. Skipping..");
    PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.DONE);
  }
  if (underConstructionNumber > 1) return [true, !!afterUpgrade];
  return [false, !!afterUpgrade];
};
