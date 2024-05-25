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
  if (!upgradeButton) {
    await page.logger(LoggerLevels.ERROR, "Upgrade button not found");
    console.error("ERROR: Upgrade button not found");
    return;
  }
  await upgradeButton.click();
};

export const clickOnExchangeButton = async (
  page: Page,
  exchangeButtonManual?: any
) => {
  await delay(200, 600);
  const exchangeButton =
    exchangeButtonManual || (await page.$(".upgradeBlocked button.exchange"));
  if (!exchangeButton) {
    await page.logger(LoggerLevels.ERROR, "Exchange button not found");
    console.error("ERROR: Exchange button not found");
    return;
  }

  await exchangeButton.click();
  await delay(950, 1150);

  const distributecontainer = await page.$("#build.exchangeResources");
  if (!distributecontainer) {
    await page.logger(LoggerLevels.ERROR, "Distribute container not found");
    console.error("ERROR: Distribute container not found");
    return;
  }
  console.log("Distribute container found");
  const distributeButton = await distributecontainer.$(
    "#submitText button.gold"
  );
  if (!distributeButton) {
    await page.logger(LoggerLevels.ERROR, "Distribute button not found");
    console.error("ERROR: Distribute button not found");
    return;
  }
  const outerHTml = await distributeButton.evaluate((el) => el.outerHTML);
  console.log("Distribute button found", outerHTml);
  await distributeButton.click();
  await delay(950, 1150);

  const npcButton = await page.$("#npc_market_button");
  if (!npcButton) {
    await page.logger(LoggerLevels.ERROR, "NPC button not found");
    console.error("ERROR: NPC button not found");
    return;
  }
  await npcButton.click();
  try {
    await page.waitForNavigation({ timeout: 5000 });
  } catch (e) {
    console.log("wait for navigation failed");
    await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
    return;
  }

  await clickOnUpgradeButton(page);
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
  try {
    await page.waitForSelector("#build", { timeout: 5000 });
  } catch (e) {
    console.log("wait for navigation failed");
    await page.logger(LoggerLevels.ERROR, "waiting for #build failed..");
    return;
  }
};

export const checkAllResourcesAndAddThemIfPossible = async (
  page: Page,
  cbNavigation: NavigationTypes,
  manualResources?: (string | null)[]
) => {
  const { wood, clay, iron, crop, maxGranary, maxWarehouse } =
    await getResourceAmount(page);
  const amountToUpgrade = await getAmountToUpgrade(page, manualResources);
  if (!amountToUpgrade) {
    await page.logger(LoggerLevels.ERROR, "Amount to upgrade not found");
    return [false, false];
  }
  const {
    wood: nWood,
    clay: nClay,
    iron: nIron,
    crop: nCrop,
  } = amountToUpgrade;

  // Get hero resources
  await clickNavigationSlot(page, NavigationTypes.HERO);
  try {
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 });
  } catch (e) {
    console.log("wait for navigation failed");
    await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
    return [false, false];
  }
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
  let forceUpgrade = false;
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

    forceUpgrade = true;
    await page.logger(
      LoggerLevels.INFO,
      `Hero doesnt have enoug of ${resources[index]}. Missing amount: ${missingResource}`
    );
    console.log(
      `Hero doesnt have enoug of ${resources[index]}. Missing amount: ${missingResource}`
    );
  }

  // Check if we should force upgrade field
  if (forceUpgrade) {
    const transfarableResources = calculateTransferableResources(
      maxWarehouse,
      maxGranary,
      [wood, clay, iron, crop],
      heroResourcesArray
    );
    const upgradeFeasibility = checkUpgradeFeasibility(
      [wood, clay, iron, crop],
      transfarableResources,
      [nWood, nClay, nIron, nCrop]
    );
    if (upgradeFeasibility < 0) {
      await page.logger(
        LoggerLevels.INFO,
        `Not enough resources.. Missing ${upgradeFeasibility}} resource for 2x value of field cost..`
      );
      console.log(
        `Not enough resources.. Missing ${upgradeFeasibility}} resource for 2x value of field cost..`
      );
      return [false, false];
    }

    // Add All possible resources from hero
    for (let i = 0; i < transfarableResources.length; i++) {
      const resourceAmountToBeAdded = transfarableResources[i];
      if (resourceAmountToBeAdded === 0) {
        continue;
      }
      const resourceElement = heroResourcesElements[i]!;
      await collectSingleHeroResource(
        page,
        resourceElement,
        resourceAmountToBeAdded
      );
    }
    await clickNavigationSlot(page, cbNavigation);
    return [true, true];
  }

  await clickNavigationSlot(page, cbNavigation);
  return [true, false];
};

function calculateTransferableResources(
  maxWarehouse: number,
  maxGranary: number,
  currentResources: number[],
  heroResources: number[]
) {
  const buffer = 10; // This is the buffer space left in the storage
  const maxResources = [
    maxWarehouse - buffer,
    maxWarehouse - buffer,
    maxWarehouse - buffer,
    maxGranary - buffer,
  ]; // Maximum resources that can be stored with buffer

  // Determine the maximum amount of each resource that can be transferred from the hero to the warehouse/granary
  let transferableResources = heroResources.map((heroResource, index) => {
    const availableSpace = maxResources[index] - currentResources[index]; // Calculate the space available for more resources
    return Math.min(heroResource, availableSpace); // Determine the maximum that can be transferred without overflow
  });

  return transferableResources; // Return the array of transferable resource amounts
}

function checkUpgradeFeasibility(
  currentResources: number[],
  transferableResources: number[],
  fieldCost: number[]
) {
  // Calculate the new potential resources by adding the transferable amounts to the current resources
  const newResourcesSum =
    transferableResources.reduce((s, n) => s + n, 0) +
    currentResources.reduce((s, n) => s + n, 0);

  // Check if the new resource amounts are at least twice the field cost
  const canUpgrade = newResourcesSum - fieldCost.reduce((s, n) => s + n, 0) * 2;

  return canUpgrade;
}

export const getAlreadyBuiltBuildings = async (page: Page) => {
  const buildingSlots = await page.$$("#villageContent .buildingSlot");
  return buildingSlots.filter(async (buildingSlot) => {
    const attrName = await buildingSlot.evaluate((el) =>
      el.getAttribute("data-name")
    );
    return attrName !== "";
  });
};
