import { ElementHandle, Page } from "puppeteer";
import { clickNavigationSlot } from "./clicker";
import { NavigationTypes } from "../slots/navigationSlots";
import { delay, timeToSeconds } from "../../utils";
import { EResources, Resources } from "./resources";
import { LoggerLevels } from "../../config/logger";

enum EResourcesElements {
  WOOD = "woodElement",
  CLAY = "clayElement",
  IRON = "ironElement",
  CROP = "cropElement",
}

enum ResourcesInventory {
  WOOD = "item145",
  CLAY = "item146",
  IRON = "item147",
  CROP = "item148",
}

interface HeroResourcesElements {
  [EResourcesElements.WOOD]: ElementHandle<Element> | null;
  [EResourcesElements.CLAY]: ElementHandle<Element> | null;
  [EResourcesElements.IRON]: ElementHandle<Element> | null;
  [EResourcesElements.CROP]: ElementHandle<Element> | null;
}

interface HeroResourcesStore extends Resources, HeroResourcesElements {}

function getEnumKeyByEnumValue<T extends { [index: string]: string }>(
  myEnum: T,
  enumValue: string
): keyof T | null {
  let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
  return keys.length > 0 ? keys[0] : null;
}

export const getAvailableHeroResources = async (
  page: Page
): Promise<HeroResourcesStore> => {
  const heroResources: HeroResourcesStore = {
    wood: 0,
    clay: 0,
    iron: 0,
    crop: 0,
    woodElement: null,
    clayElement: null,
    ironElement: null,
    cropElement: null,
  };

  const allItems = await page.$$(".heroItem");
  for (let item of allItems) {
    const itemId = await item.evaluate(
      (el) => el.querySelector(".item")?.classList[1]
    );
    if (!itemId) continue;
    if (
      Object.values(ResourcesInventory).includes(itemId as ResourcesInventory)
    ) {
      const itemCount = await item.evaluate((el) =>
        parseInt(el.querySelector(".count")?.textContent || "0", 10)
      );
      const lowKey = getEnumKeyByEnumValue(
        ResourcesInventory,
        itemId
      )?.toLocaleLowerCase() as keyof Resources;
      const lowKeyElement = (lowKey + "Element") as keyof HeroResourcesElements;
      if (!lowKey) continue;
      heroResources[lowKey] = itemCount;
      heroResources[lowKeyElement] = item;
    }
  }
  return heroResources;
};

export const collectAllHeroResources = async (page: Page) => {
  await clickNavigationSlot(page, NavigationTypes.HERO);
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  const heroResources = await getAvailableHeroResources(page);
  await collectAllResources(
    page,
    Object.values(EResourcesElements).map((key) => heroResources[key]!)
  );
};

const collectAllResources = async (
  page: Page,
  heroResources: ElementHandle<Element>[]
) => {
  for (let resource of heroResources) {
    await collectSingleHeroResource(page, resource);
  }
};

export const collectSingleHeroResource = async (
  page: Page,
  element: ElementHandle<Element>,
  amount?: number
) => {
  element.click();
  await delay(400, 869);
  const inputeSelector = ".dialogVisible #consumableHeroItem input";
  await page.waitForSelector(inputeSelector, { visible: true });
  const inputValue = await page.$eval(inputeSelector, (el) => el.value);

  // Dont transfer resources if input is less then 10
  if (parseInt(inputValue) < 10) {
    await page.logger(
      LoggerLevels.INFO,
      "Not enough resources or warehouse/grannary is full."
    );
    console.log("Not enough resources or warehouse/grannary is full.");
    await page.click(".dialogVisible button.grey");
    await delay(400, 869);
    return;
  }

  // Select resource and delete amount
  await page.click(inputeSelector);
  for (let i = 0; i < inputValue.length; i++) {
    await page.keyboard.press("Backspace");
    await delay(97, 356);
  }

  // Type new amount
  await page.focus(inputeSelector);
  const newAmount = amount || parseInt(inputValue) - 10;
  await page.keyboard.type(newAmount.toString());
  await delay(497, 656);

  // Add resources
  await page.click(".dialogVisible button.green");
  await delay(402, 703);
};

export const goToClosestAdventureIfExsists = async (page: Page) => {
  await clickNavigationSlot(page, NavigationTypes.ADVENTURES);
  await page.waitForSelector("#heroAdventure tr", { visible: true });

  // If there is no advetures available return
  if (await page.$("#heroAdventure .noAdventures")) {
    await page.logger(LoggerLevels.INFO, "No adventures available.");
    console.log("No adventures available.");
    return;
  }

  // If hero is unavailable return
  if (await page.$("#heroAdventure .statusRunning_medium")) {
    await page.logger(LoggerLevels.INFO, "Hero is unavailable.");
    console.log("Hero is unavailable.");
    return;
  }

  const adventures = await page.$$("#heroAdventure tbody tr");

  const sortedAdventures = await Promise.all(
    adventures.map(async (adventure) => {
      const timeString = await adventure.$eval(
        ".duration",
        (el) => el.textContent
      );
      if (!timeString) return { adventure, time: 0 };
      const time = timeToSeconds(timeString);
      return { adventure, time };
    })
  );

  sortedAdventures.sort((a, b) => a.time - b.time);

  const closestAdventure = sortedAdventures[0].adventure;
  const button = await closestAdventure.$("button");
  button?.click();
};

export const levelupHero = async (page: Page) => {
  const levelUpSign = await page.$("#topBarHeroWrapper .levelUp.show");
  if (levelUpSign) {
    // Go to hero
    await clickNavigationSlot(page, NavigationTypes.HERO);
    await delay(400, 869);
    await page.waitForSelector(".scrollingContainer", { visible: true });

    // Go to attributes
    const tabs = await page.$$(".scrollingContainer .content");
    const attributes = tabs[1];
    await attributes.click();
    await page.waitForSelector(".heroAttributes", { visible: true });

    // Get progress bars
    const progresses = await page.$$(".heroAttributes .progressBar");
    let pointsStrength = await page.$eval(
      'input[name="fightingStrength"]',
      (el) => parseInt(el.value, 10) || 0
    );
    let pointsResources = await page.$eval(
      'input[name="resourceProduction"]',
      (el) => parseInt(el.value, 10) || 0
    );
    const availablePoints = await page.$eval(".pointsAvailable", (el) =>
      parseInt(el.textContent || "0", 10)
    );

    const strength = await progresses[0].$("button.plus");
    const resources = await progresses.pop()?.$("button.plus");

    const pointsAddedTo = pointsStrength > 5 ? "resources" : "strength";
    for (let i = 0; i < availablePoints; i++) {
      if (pointsStrength < 5) {
        console.log("Adding point to strength");
        // print element
        await strength?.click();
        await delay(400, 869);
        pointsStrength++;
        continue;
      }
      await resources?.click();
      pointsResources++;
      await delay(388, 859);
    }
    await page.logger(
      LoggerLevels.SUCCESS,
      "Succesfully leveled up hero. Points added to " + pointsAddedTo
    );
    // Save points
    await page.click("#savePoints");
  }
};
