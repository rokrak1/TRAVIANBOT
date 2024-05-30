import { Page } from "puppeteer";
import { CSV_ROW, delay } from "../../utils";
import { clickNavigationSlot } from "../travianActions/clicker";
import { NavigationTypes } from "./navigationSlots";
import {
  checkAllResourcesAndAddThemIfPossible,
  clickOnBuildingSlot,
  clickOnExchangeButton,
  clickOnUpgradeButton,
} from "./builder";
import { LoggerLevels } from "../../config/logger";
import { PlanItem, PlanSingelton, PlanStatus } from "../funcs/plan";

export const upgradeFields = async (
  page: Page,
  row: PlanItem,
  underConstructionNumber: number
) => {
  const pageUrl = page.url();
  // Only go to town if not already in town
  if (!pageUrl.includes("dorf1")) {
    await clickNavigationSlot(page, NavigationTypes.RESOURCES);
    await delay(200, 600);
  }
  const allFields = await page.$$("#resourceFieldContainer a.level");
  for (let i = 0; i < allFields.length; i++) {
    const allFields = await page.$$("#resourceFieldContainer a.level");
    // End the loop if there are already 2 constructions
    if (underConstructionNumber > 1) return true;

    // TODO: Refactor this so it can be reused in building upgrades
    const isFieldUnderConstruction = await allFields[i].evaluate((el) =>
      el.classList.contains("underConstruction")
    );
    const isFieldMaxLevel = await allFields[i].evaluate((el) =>
      el.classList.contains("maxLevel")
    );
    const isFieldNotNow = await allFields[i].evaluate((el) =>
      el.classList.contains("notNow")
    );
    const isFieldGoodToUpgrade = await allFields[i].evaluate((el) =>
      el.classList.contains("good")
    );
    const buildingSlot = await allFields[i].evaluate((el) =>
      Array.from(el.classList).find((c) => c.includes("buildingSlot"))
    );

    const fieldLevel = await allFields[i].evaluate(
      (el) => el.classList[el.classList.length - 1]
    );

    // Set level number and check if building is upgrading
    let fieldLevelNumber = parseInt(fieldLevel.replace("level", ""), 10);
    const isUpgrading = await allFields[i].evaluate((el) =>
      el.querySelector("a.underConstruction ")
    );
    fieldLevelNumber += isUpgrading ? 1 : 0;
    if (
      row.level > fieldLevelNumber &&
      !isFieldUnderConstruction &&
      !isFieldMaxLevel
    ) {
      if (isFieldGoodToUpgrade) {
        await clickOnBuildingSlot(page, buildingSlot);
        await clickOnUpgradeButton(page);
        await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
        try {
          await page.waitForNavigation({
            waitUntil: "networkidle0",
            timeout: 5000,
          });
        } catch (e) {
          await page.logger(
            LoggerLevels.ERROR,
            "waiting for navigation failed.."
          );
          return;
        }
        underConstructionNumber++;
      } else if (isFieldNotNow) {
        console.log(
          "Field is not good to upgrade.. Checking hero resources..."
        );
        await page.logger(
          LoggerLevels.INFO,
          "Field is not good to upgrade.. Checking hero resources..."
        );
        await clickOnBuildingSlot(page, buildingSlot);

        // Check if there are enough resources and add them from hero if possible
        const [necessaryResources, forceUpgrade] =
          await checkAllResourcesAndAddThemIfPossible(
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

        const upgradeFunc = forceUpgrade
          ? clickOnExchangeButton
          : clickOnUpgradeButton;
        await upgradeFunc(page);
        await page.logger(LoggerLevels.SUCCESS, `Field upgraded.`);
        console.log("Field upgraded..");
        try {
          await page.waitForNavigation({
            waitUntil: "networkidle0",
            timeout: 5000,
          });
        } catch (e) {
          await page.logger(
            LoggerLevels.ERROR,
            "waiting for navigation failed.."
          );
          return;
        }
        underConstructionNumber++;
      }
    }
  }
  if (underConstructionNumber > 1) return true;
  await page.logger(LoggerLevels.INFO, "All fields upgraded. Skipping..");
  PlanSingelton.getInstance().updateStatus(row.id, PlanStatus.DONE);
};
