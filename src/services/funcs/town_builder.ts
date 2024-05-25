import { ElementHandle, Page } from "puppeteer";
import { CSV_ROW, delay } from "../../utils";
import { NavigationTypes } from "../slots/navigationSlots";
import { clickNavigationSlot } from "./clicker";
import {
  checkAllResourcesAndAddThemIfPossible,
  clickOnExchangeButton,
  clickOnUpgradeButton,
  getAlreadyBuiltBuildings,
} from "./builder";
import { rSlots } from "../slots/resourcesSlots";
import { LoggerLevels } from "../../config/logger";
import { Slots } from "../slots/csvSlots";

export const upgradeBuilding = async (page: Page, row: CSV_ROW) => {
  const pageUrl = page.url();

  // Only go to town if not already in town
  if (!pageUrl.includes("dorf2")) {
    await clickNavigationSlot(page, NavigationTypes.TOWN);
  }

  const alreadyBuildedBuildings = await getAlreadyBuiltBuildings(page);
  for (let buildingSlot of alreadyBuildedBuildings) {
    const buildingSlotIndex = alreadyBuildedBuildings.indexOf(buildingSlot);

    // Check if building is already built
    const attrName = await buildingSlot.evaluate((el) =>
      el.getAttribute("data-name")
    );
    const toSlotKey = attrName
      ?.toUpperCase()
      .replace(" ", "_") as keyof typeof Slots;

    if (toSlotKey === row.slot) {
      // Check if field is good to upgrade
      const isFieldGoodToUpgrade = await buildingSlot.$eval("a", (el) =>
        el.classList.contains("good")
      );
      const isFieldNotNow = await buildingSlot.$eval("a", (el) =>
        el.classList.contains("notNow")
      );

      const isFieldMaxLevel = await buildingSlot.$eval("a", (el) =>
        el.classList.contains("maxLevel")
      );
      const isFieldUnderConstruction = await buildingSlot.$eval("a", (el) =>
        el.classList.contains("underConstruction")
      );

      if (isFieldMaxLevel) {
        await page.logger(
          LoggerLevels.INFO,
          "Building is already max level. Skipping.."
        );
        console.log("Field is already max level. Skipping..");
        return [false, false];
      }

      // Check level difference
      const level = await buildingSlot.evaluate(
        (el) => el.querySelector(".labelLayer")!.textContent
      );
      if (!level) {
        await page.logger(LoggerLevels.ERROR, "Level not found");
        console.error("ERROR: Level not found");
        return [true, true];
      }

      // Set level number and check if building is upgrading
      let levelNumber = parseInt(level, 10);
      levelNumber += isFieldUnderConstruction ? 1 : 0;
      if (parseInt(row.level, 10) > levelNumber) {
        console.log(
          "Level is not enough.. Current:",
          levelNumber,
          ", Should be: ",
          row.level
        );

        // FreezeIndex of rows if building should be upgraded more than 1 level
        const freezeIndex = parseInt(row.level, 10) - levelNumber > 1;
        await page.logger(
          LoggerLevels.INFO,
          `Freezing index, level is too low.. Current lvl: ${levelNumber}, Should be: ${row.level}`
        );

        if (isFieldGoodToUpgrade) {
          // Start building upgrade
          await buildingSlot.click();
          try {
            await page.waitForNavigation({ timeout: 5000 });
          } catch (e) {
            await page.logger(
              LoggerLevels.ERROR,
              "waiting for navigation failed.."
            );
            return;
          }
          await clickOnUpgradeButton(page);
          await page.logger(LoggerLevels.SUCCESS, `Building upgraded.`);
          try {
            await page.waitForNavigation({ timeout: 5000 });
          } catch (e) {
            await page.logger(
              LoggerLevels.ERROR,
              "waiting for navigation failed.."
            );
            return;
          }
          await delay(200, 600);
          return [false, freezeIndex];
        } else if (isFieldNotNow) {
          console.log(
            "Building is not good to upgrade.. Checking resources..."
          );
          await buildingSlot.click();
          try {
            await page.waitForNavigation({ timeout: 5000 });
          } catch (e) {
            await page.logger(
              LoggerLevels.ERROR,
              "waiting for navigation failed.."
            );
            return;
          }

          const [necessaryResources, forceUpgrade] =
            await checkAllResourcesAndAddThemIfPossible(
              page,
              NavigationTypes.TOWN
            );
          if (!necessaryResources) {
            await page.logger(LoggerLevels.INFO, "Not enough resources..");
            console.log("Not enough resources..");
            return [true, false];
          }

          const newBuildingSlots = await getAlreadyBuiltBuildings(page);
          const newBuildingSlot = newBuildingSlots[buildingSlotIndex];

          // Start building construction
          await newBuildingSlot.click();
          try {
            await page.waitForNavigation({ timeout: 5000 });
          } catch (e) {
            await page.logger(
              LoggerLevels.ERROR,
              "waiting for navigation failed.."
            );
            return;
          }

          const upgradeFunc = forceUpgrade
            ? clickOnExchangeButton
            : clickOnUpgradeButton;
          await upgradeFunc(page);

          await page.logger(LoggerLevels.SUCCESS, `Building upgraded.`);
          await page.waitForNavigation({
            waitUntil: "networkidle0",
            timeout: 5000,
          });
          return [false, freezeIndex];
        }
      } else {
        await page.logger(LoggerLevels.INFO, "Done.. Skipping..");
        console.log("Done, Skipping..");
        return [false, false];
      }
    }
  }

  const emptySlot = await getFirstEmptySlot(page);
  if (emptySlot) {
    await page.logger(
      LoggerLevels.INFO,
      "Building is not built.. Building new one.."
    );
    console.log("Building is not built.. Building new one..");
    let building = await openEmptySlotAndBuild(page, emptySlot, row);

    if (!building) {
      await page.logger(LoggerLevels.ERROR, "Building not found..");
      console.error("ERROR: Building not found..");
      return [true, false];
    }

    // Check if there is enough resources
    const buildingConstructionButtonGold = await building.$(
      ".contractLink button.gold"
    );

    // Check if there are enough resources and add them from hero if possible
    if (buildingConstructionButtonGold) {
      console.log("Building is not good to build.. Checking resources...");
      await page.logger(
        LoggerLevels.INFO,
        "Building is not good to build.. Checking resources..."
      );
      const resources = await building.$$eval(".resource .value", (el) =>
        el.map((e) => e.textContent)
      );
      const [necessaryResources, forceUpgrade] =
        await checkAllResourcesAndAddThemIfPossible(
          page,
          NavigationTypes.TOWN,
          resources
        );
      if (!necessaryResources) {
        await page.logger(LoggerLevels.INFO, "Not enough resources..");
        console.log("Not enough resources..");
        return [true, false];
      }
      await delay(500, 800);
      // Go back to building
      const newEmptySlot = await getFirstEmptySlot(page);
      building = await openEmptySlotAndBuild(page, newEmptySlot!, row);
      if (!building) {
        await page.logger(LoggerLevels.ERROR, "Building not found..");
        console.error("ERROR: Building not found..");
        return [true, false];
      }

      if (forceUpgrade) {
        const exchangeButton = await building.$("button.exchange");
        if (!exchangeButton) {
          console.error("Exchange button not found..");
          await page.logger(
            LoggerLevels.ERROR,
            "Exchange button not found.. $exchangeButton$"
          );
          return [true, false];
        }
        await clickOnExchangeButton(page, exchangeButton);
      }
    }

    // Check if button is green
    const buildingConstructionButton = await building.$(
      ".contractLink button.green"
    );
    if (!buildingConstructionButton) {
      console.error("Building construction button not found..");
      await page.logger(
        LoggerLevels.ERROR,
        "Building construction button not found.. $buildingConstructionButton$"
      );
      return [true, false];
    }

    // Start building construction
    await buildingConstructionButton.click();
    try {
      await page.waitForNavigation({ timeout: 5000 });
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
      return;
    }
    await page.logger(LoggerLevels.SUCCESS, `Building construction started.`);
    const freezeIndex = parseInt(row.level, 10) > 1;
    freezeIndex &&
      (await page.logger(
        LoggerLevels.INFO,
        `Freezing index, level is too low.. Current lvl: 0, Should be: ${row.level}`
      ));
    return [false, freezeIndex];
  } else {
    console.log("There is no empty slot..");
    await page.logger(LoggerLevels.ERROR, "There is no empty slot..");
    return [true, false];
  }
};

const openEmptySlotAndBuild = async (
  page: Page,
  firstEmptySlot: ElementHandle<Element>,
  row: CSV_ROW
) => {
  const path = await firstEmptySlot.$("path");
  if (path) {
    await path.click();
    try {
      await page.waitForNavigation({ timeout: 5000 });
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
      return;
    }
  }
  await delay(200, 600);

  // Search for building in all tabs
  const building = await findBuilding(page, row);
  if (!building) {
    await page.logger(
      LoggerLevels.ERROR,
      "Building not found.. $openEmptySlotAndBuild$"
    );
    console.error("Building not found..");
    return false;
  }
  return building;
};

const findBuilding = async (page: Page, row: CSV_ROW) => {
  const tabs = await page.$$(".scrollingContainer a");
  for (let tab of tabs) {
    await tab.click();
    try {
      await page.waitForNetworkIdle({ timeout: 5000 });
    } catch (e) {
      await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
      return;
    }
    await delay(200, 600);
    const buildingList = await page.$$(".buildingWrapper");
    const building = buildingList.find(async (building) => {
      const buildingName = await building.evaluate(
        (el) => el.querySelector("h2")?.textContent
      );
      const buildingNameKey = buildingName
        ?.toUpperCase()
        .trim()
        .replace(" ", "_") as keyof typeof Slots;
      return buildingNameKey === row.slot;
    });
    if (building) return building;
  }
  return null;
};

const getFirstEmptySlot = async (page: Page) => {
  const buildingSlots = await page.$$("#villageContent .buildingSlot");

  for (const buildingSlot of buildingSlots) {
    const attrName = await buildingSlot.evaluate((el) =>
      el.getAttribute("data-name")
    );
    const classNameWallOrRallyPoint = await buildingSlot.evaluate(
      (el) => el.classList.contains("a40") || el.classList.contains("a39")
    );

    console.log(attrName, "attrName", classNameWallOrRallyPoint);

    if (attrName === "" && !classNameWallOrRallyPoint) {
      console.log("Building slot found..", attrName, classNameWallOrRallyPoint);
      return buildingSlot;
    }
  }

  return null;
};
