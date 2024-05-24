import { Page } from "puppeteer";
import { delay, parseValue } from "../../utils";
import { LoggerLevels } from "../../config/logger";

export const extendGoldPlanAndResources = async (page: Page) => {
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
