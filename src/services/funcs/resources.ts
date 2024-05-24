import { Page } from "puppeteer";
import { parseValue } from "../../utils";

export enum EResources {
  WOOD = "wood",
  CLAY = "clay",
  IRON = "iron",
  CROP = "crop",
}

export interface Resources {
  [EResources.WOOD]: number;
  [EResources.CLAY]: number;
  [EResources.IRON]: number;
  [EResources.CROP]: number;
}

interface ResourcesStore extends Resources {
  maxWarehouse: number;
  maxGranary: number;
}

export const getResourceAmount = async (
  page: Page
): Promise<ResourcesStore> => {
  const resources: ResourcesStore = {
    maxWarehouse: 0,
    maxGranary: 0,
    wood: 0,
    clay: 0,
    iron: 0,
    crop: 0,
  };
  // Wood
  const woodRaw = await page.evaluate(() => {
    const wood = document
      .querySelector(".lumber_small")
      ?.closest(".stockBarButton")
      ?.querySelector(".value");
    return wood?.textContent || "0";
  });
  resources.wood = parseValue(woodRaw);

  // Clay
  const clayRaw = await page.evaluate(() => {
    const clay = document
      .querySelector(".clay_small")
      ?.closest(".stockBarButton")
      ?.querySelector(".value");
    return clay?.textContent || "0";
  });
  resources.clay = parseValue(clayRaw);

  // Iron
  const ironRaw = await page.evaluate(() => {
    const iron = document
      .querySelector(".iron_small")
      ?.closest(".stockBarButton")
      ?.querySelector(".value");
    return iron?.textContent || "0";
  });
  resources.iron = parseValue(ironRaw);

  // Crop
  const cropRaw = await page.evaluate(() => {
    const crop = document
      .querySelector(".crop_small")
      ?.closest(".stockBarButton")
      ?.querySelector(".value");
    return crop?.textContent || "0";
  });
  resources.crop = parseValue(cropRaw);

  // Warehouse
  const warehouseRaw = await page.$eval(
    "#stockBar .warehouse .capacity .value",
    (el) => el?.textContent || "0"
  );
  resources.maxWarehouse = parseValue(warehouseRaw);

  // Granary
  const granaryRaw = await page.$eval(
    "#stockBar .granary .capacity .value",
    (el) => el?.textContent || "0"
  );
  resources.maxGranary = parseValue(granaryRaw);
  return resources;
};
