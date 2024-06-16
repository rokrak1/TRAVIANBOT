import { HTTPRequest, HTTPResponse, Page } from "puppeteer";
import { clickNavigationSlot } from "../travianActions/clicker";
import { NavigationTypes } from "../villageBuilder/navigationSlots";
import { delay } from "../../../utils";
import { fetchOasisFromPositionNew } from "./dataFetching";
import { oases } from "./allTroops";
import { LoggerLevels } from "../../../config/logger";
import { getOnlyNewOasis, getRichOasis } from "./fetchOasis";

const positionsInterceptor = async (page: Page) => {
  // Function to handle request events
  await page.setRequestInterception(true);
  const handleResponse = async (response: HTTPResponse) => {
    const request = response.request();
    if (request.url().includes("api/v1/map/position")) {
      const data = await response.json();
      const newOases = fetchOasisFromPositionNew(data.tiles);
      if (newOases) {
        const onlyNewOasis = getOnlyNewOasis(oases, newOases);
        const richOases = getRichOasis(onlyNewOasis);
        oases.push(...richOases);
        console.log(oases.length);
      }
    }
  };
  page.on("response", handleResponse);

  await page.setRequestInterception(true);
  const handleRequest = async (request: HTTPRequest) => {
    if (request.resourceType() === "xhr") {
      const requestHeaders = request.headers();
      if (requestHeaders["cookie"]) {
      }
    }
    request.continue();
  };

  page.on("request", handleRequest);
};

export const goToMapFetchBoundingBox = async (page: Page) => {
  // Re-implement the function to start oasis farmer
  await clickNavigationSlot(page, NavigationTypes.MAP);
  await delay(1000, 1200);

  // Start the interceptor
  await positionsInterceptor(page);

  // Get map
  const mapContainer = await page.$("#mapContainer");
  if (!mapContainer) {
    await page.logger(LoggerLevels.ERROR, "Map container not found");
    return;
  }

  const mapNavigation = await page.$("#navigation a.map");
  if (!mapNavigation) {
    await page.logger(LoggerLevels.ERROR, "Map navigation item not found");
    return;
  }

  const boundingBoxNavigationMap = await mapNavigation.boundingBox();
  if (!boundingBoxNavigationMap) {
    await page.logger(LoggerLevels.ERROR, "Map navigation box not found");
    return;
  }
  const { x, y } = boundingBoxNavigationMap;

  const boundingBox = await mapContainer.boundingBox();
  if (!boundingBox) {
    await page.logger(LoggerLevels.ERROR, "Map container box not found");
    return;
  }
  const { x: mapX, y: mapY, width: mapWidth, height: mapHeight } = boundingBox;

  // Get the center of the map
  const centerX = mapX + mapWidth / 2;
  const centerY = mapY + mapHeight / 2;

  return { centerX, centerY, mapX, mapY, mapWidth, mapHeight };
};

// Function to create the exploration grid
export function createExplorationGrid(maxTop: number, maxBottom: number, maxLeft: number, maxRight: number) {
  const width = maxLeft + maxRight + 1;
  const height = maxTop + maxBottom + 1;
  const grid = Array(height)
    .fill(null)
    .map(() => Array(width).fill("?"));
  const startX = maxLeft;
  const startY = maxTop;

  return { grid, startX, startY };
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
