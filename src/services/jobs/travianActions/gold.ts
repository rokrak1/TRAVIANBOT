import { Page } from "puppeteer";
import { delay, parseValue } from "../../../utils";
import { LoggerLevels } from "../../../config/logger";
import { clickNavigationSlot } from "./clicker";
import { NavigationTypes } from "../villageBuilder/navigationSlots";

export const extendGoldPlanAndResources = async (page: Page) => {
  const url = page.url();
  if (!url.includes("dorf1")) {
    await clickNavigationSlot(page, NavigationTypes.RESOURCES);
  }

  await checkFirstTimeGoldActivation(page);

  const goldPlanExtendedOffers = await page.$$(
    "#sidebarBoxInfobox li button.gold"
  );

  if (goldPlanExtendedOffers.length === 0) {
    await page.logger(LoggerLevels.INFO, "No gold extend offers found");
    console.log("No gold extend offers found");
    return;
  }

  let { gold } = await getGoldAndSilver(page);

  for (let offer of goldPlanExtendedOffers) {
    const goldValue = await offer.evaluate((el) => {
      return el.querySelector("span.goldValue")?.textContent;
    });
    const is5or10Gold = goldValue === "5" || goldValue === "10";

    if (is5or10Gold) {
      if (gold < parseInt(goldValue)) {
        await page.logger(
          LoggerLevels.WARN,
          `Not enough gold to extend offer. Need ${goldValue} gold`
        );
        console.log("Not enough gold to extend offer");
        continue;
      }
      const extendItem = goldValue === "5" ? "25% production" : "plus account";
      await page.logger(
        LoggerLevels.GOLD_SPENT,
        `Extending gold offer for ${extendItem}. Spent ${goldValue} gold`
      );
      console.log(`Extending gold offer for ${extendItem} `);
      await offer.click();
      await delay(200, 500);
      gold -= parseInt(goldValue);
    }
  }
};

const checkFirstTimeGoldActivation = async (page: Page) => {
  const productionBoostButton = await page.$(
    "button.gold.productionBoostButton"
  );
  if (!productionBoostButton) {
    await page.logger(LoggerLevels.INFO, "No production boost button found");
    console.log("No production boost button found");
    return;
  }
  await productionBoostButton?.click();
  await delay(200, 500);

  for (let offerNumber of [0, 1, 2, 3]) {
    const productionBoostOffers = await page.$$(".packageFeatures");
    if (!productionBoostOffers[offerNumber]) {
      await page.logger(LoggerLevels.INFO, "No production boost offers found");
      console.log("No production boost offers found");
      return;
    }
    const offerButton = await productionBoostOffers[offerNumber].$("button");
    if (!offerButton) {
      await page.logger(
        LoggerLevels.INFO,
        "No production boost offer button found"
      );
      console.log("No production boost offer button found");
      continue;
    }
    const isActivate = await offerButton.evaluate((el) => {
      const div = el.querySelector("div");
      let textContent = "";
      div!.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Check if the node is a text node
          textContent += node!.textContent!.trim() + " "; // Append text content of the node
        }
      });
      return textContent.trim();
    });
    console.log("isActivate", isActivate);
    if (isActivate == "Activate") {
      const title = await productionBoostOffers[offerNumber].evaluate((el) => {
        return el.querySelector(".featureTitle")?.textContent;
      });
      console.log(`Activated production boost offer: ${title}`);
      await page.logger(
        LoggerLevels.GOLD_SPENT,
        `Activated production boost offer: ${title}`
      );
      await offerButton.click();
      await delay(800, 1100);
    }
  }

  const closeProductionBoostButton = await page.$(
    ".premiumFeaturePackage div.dialogCancelButton"
  );
  console.log("Closing production boost modal", closeProductionBoostButton);
  await closeProductionBoostButton?.click();
  await page.logger(LoggerLevels.INFO, "Production boost check completed");
  await delay(1000, 1300);
};

const getGoldAndSilver = async (page: Page) => {
  const rawValues = await page.$$eval("#header .currency .value", (els) =>
    els.map((el) => el.textContent)
  );
  const rawGoldValue = rawValues[0];
  const rawSilverValue = rawValues[1];

  if (!rawGoldValue || !rawSilverValue) {
    await page.logger(
      LoggerLevels.ERROR,
      "Could not get gold and silver values!"
    );
    console.error("Could not get gold and silver values");
    return { gold: 0, silver: 0 };
  }

  return {
    gold: parseValue(rawGoldValue),
    silver: parseValue(rawSilverValue),
  };
};
