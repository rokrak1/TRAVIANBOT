import { Page } from "puppeteer";
import { delay } from "../../utils";
import { getResourceAmount } from "./resources";
import { LoggerLevels } from "../../config/logger";
import { NavigationTypes } from "../slots/navigationSlots";
import { clickNavigationSlot } from "./clicker";
import { collectSingleHeroResource, getAvailableHeroResources } from "./hero";
import { rSlots } from "../slots/resourcesSlots";

export const clickOnUpgradeButton = async (page: Page) => {
  await delay(200, 600);
  const upgradeButton = await page.$(
    ".upgradeButtonsContainer .section1 button.green"
  );
  if (!upgradeButton) return;
  await upgradeButton.click();
};

export const getAmountToUpgrade = async (
  page: Page,
  resources?: (string | null)[]
) => {
  const realResources =
    resources ||
    (await page.$$eval(".upgradeBuilding #contract .resource .value", (el) =>
      el.map((e) => e.textContent)
    ));
  if (realResources.length < 4) {
    await page.logger(LoggerLevels.ERROR, "Resources not found");
    console.error("ERROR: Resources not found");
    return;
  }
  return {
    wood: parseInt(realResources[0]!, 10),
    clay: parseInt(realResources[1]!, 10),
    iron: parseInt(realResources[2]!, 10),
    crop: parseInt(realResources[3]!, 10),
  };
};

export const clickOnBuildingSlot = async (
  page: Page,
  buildingSlot?: string
) => {
  const buildingSlotSelector = Object.values(rSlots).find(
    (rs) => rs.buildingId === `.${buildingSlot}`
  )?.click;
  if (!buildingSlotSelector) {
    await page.logger(LoggerLevels.ERROR, "Building slot not found");
    return;
  }
  await buildingSlotSelector(page);
  await page.waitForSelector("#build");
};

export const checkAllResourcesAndAddThemIfPossible = async (
  page: Page,
  cbNavigation: NavigationTypes,
  manualResources?: (string | null)[]
) => {
  const { wood, clay, iron, crop } = await getResourceAmount(page);
  const amountToUpgrade = await getAmountToUpgrade(page, manualResources);
  if (!amountToUpgrade) return;
  const {
    wood: nWood,
    clay: nClay,
    iron: nIron,
    crop: nCrop,
  } = amountToUpgrade;

  // Get hero resources
  await clickNavigationSlot(page, NavigationTypes.HERO);
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  const heroResources = await getAvailableHeroResources(page);
  const { wood: hWood, clay: hClay, iron: hIron, crop: hCrop } = heroResources;

  const missingWood = nWood - wood;
  const missingClay = nClay - clay;
  const missingIron = nIron - iron;
  const missingCrop = nCrop - crop;

  const missingResources = [missingWood, missingClay, missingIron, missingCrop];
  const heroResourcesArray = [hWood, hClay, hIron, hCrop];
  const heroResourcesElements = [
    heroResources.woodElement,
    heroResources.clayElement,
    heroResources.ironElement,
    heroResources.cropElement,
  ];
  const resources = ["wood", "clay", "iron", "crop"];
  for (let missingResource of missingResources) {
    const index = missingResources.indexOf(missingResource);
    if (missingResource < 0) {
      await page.logger(
        LoggerLevels.INFO,
        `There is enough ${resources[index]}. Skipping..`
      );
      console.log(`There is enough ${resources[index]}. Skipping..`);
      continue;
    }
    const isEnoughOfCurrentResource =
      missingResource <= heroResourcesArray[index];
    if (isEnoughOfCurrentResource) {
      const resourceElement = heroResourcesElements[index]!;
      await collectSingleHeroResource(page, resourceElement, missingResource);
      continue;
    }
    await page.logger(
      LoggerLevels.INFO,
      `Hero doesnt have enoug of ${resources[index]}. Missing amount: ${missingResource}`
    );
    console.log(
      `Hero doesnt have enoug of ${resources[index]}. Missing amount: ${missingResource}`
    );
    return false;
  }

  await clickNavigationSlot(page, cbNavigation);
  return true;
};

export const getAlreadyBuiltBuildings = async (page: Page) => {
  const buildingSlots = await page.$$("#villageContent .buildingSlot");
  return buildingSlots.filter(async (buildingSlot) => {
    const attrName = await buildingSlot.evaluate((el) =>
      el.getAttribute("data-name")
    );
    return attrName !== "";
  });
};
