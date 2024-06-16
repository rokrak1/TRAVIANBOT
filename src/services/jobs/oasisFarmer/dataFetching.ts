import { HTTPRequest, Page } from "puppeteer";
import { oasisApi } from "../../utils";
import { LoggerLevels, serverLogger } from "../../../config/logger";
import { InternalAxiosRequestConfig } from "axios";
import { userAgent } from "../../funcs/browserConfiguration";
import * as cheerio from "cheerio";
import { OasisAdditionalConfiguration } from "./types";
import { animals } from "./allTroops";

export interface Tile {
  position: { x: number; y: number };
  text: string;
}

export interface OasisPosition {
  units: {
    [key: string]: string;
  };
  position: { x: number; y: number };
  distance?: number;
}

export const fetchOasisFromPositionNew = (tiles: Tile[]) => {
  try {
    const oasisPosition: OasisPosition[] = [];

    tiles.forEach((tile: Tile) => {
      const {
        position: { x, y },
        text,
      } = tile;

      if (text.includes('<i class="unit')) {
        const $ = cheerio.load(text);
        const units: {
          [key: string]: string;
        } = {};
        $(".inlineIcon.tooltipUnit").each((index, element) => {
          const unitClass = $(element)!.find("i")!.attr("class")!.split(" ")[1];
          const unitAnimal =
            Object.keys(animals).find((animal) =>
              unitClass.includes(animals[animal as keyof typeof animals])
            ) || "Unknown";
          const unitValue = $(element).find(".value").text().trim();
          units[unitAnimal] = unitValue;
        });
        oasisPosition.push({
          units,
          position: {
            x,
            y,
          },
        });
      }
    });
    return oasisPosition;
  } catch (e) {
    console.error(e);
  }
};

export const fetchOasisFromPosition = async (
  tileCatcher: any,
  position: { x: number; y: number }
) => {
  try {
    const response = await tileCatcher(position.x, position.y);
    const responseData = response.data;
    const { tiles } = responseData;

    const oasisPosition: OasisPosition[] = [];

    tiles.forEach((tile: Tile) => {
      const {
        position: { x, y },
        text,
      } = tile;

      if (text.includes('<i class="unit')) {
        const $ = cheerio.load(text);
        const units: {
          [key: string]: string;
        } = {};
        $(".inlineIcon.tooltipUnit").each((index, element) => {
          const unitClass = $(element)!.find("i")!.attr("class")!.split(" ")[1];
          const unitAnimal =
            Object.keys(animals).find((animal) =>
              unitClass.includes(animals[animal as keyof typeof animals])
            ) || "Unknown";
          const unitValue = $(element).find(".value").text().trim();
          units[unitAnimal] = unitValue;
        });
        oasisPosition.push({
          units,
          position: {
            x,
            y,
          },
        });
      }
    });
    return oasisPosition;
  } catch (e) {
    console.error(e);
  }
};

export const createTileCatcher = (domain: string, cookie: string) => {
  oasisApi.interceptors.request.use(
    (AxiosConfig: InternalAxiosRequestConfig) => {
      const newAxiosConfig = AxiosConfig;
      //@ts-ignore
      newAxiosConfig.headers = {
        cookie,
        "User-Agent": userAgent,
      };

      return newAxiosConfig;
    },
    (error) => Promise.reject(error)
  );

  const domainWithoutLastRoute = domain.split("/").slice(0, -1).join("/");

  return async (x: number, y: number) => {
    const data = {
      x,
      y,
      zoomLevel: 3,
      ignorePositions: [],
    };
    const sendData = {
      data,
    };

    return oasisApi.post(
      `${domainWithoutLastRoute}/api/v1/map/position`,
      sendData
    );
  };
};

export const getPositions = (configuration: OasisAdditionalConfiguration) => {
  /**
   * OFFSET CALCULATION
   *
   * Original positions request fetches 11x9 tiles using zoom 1.
   * Meaning 5 tiles in each x direction. 4 tiles in each y direction.
   * To which we add offset of 15 to get 30x30 tiles using zoom 3.
   *
   * Final result of fetched tiles are 30 + 5 = 35 tiles in each direction.
   *
   * Leaving us with total of 35 * +-x * 35 * +-y = 35 * 2 * 35 * 2 = 2450 tiles.
   * Estimated average per 9x9 map (zoom 1) is 8%. Which results in around 200 (196 fromt his calculation) oasis fetched.
   *
   * This is only an estimation and can vary depending on the map.
   *
   */

  const offsetY = 15 + 4;
  const offsetX = 15 + 5;

  const leftTop = {
      x: configuration.startX - offsetX,
      y: configuration.startY + offsetY,
    },
    leftBottom = {
      x: configuration.startX - offsetX,
      y: configuration.startY - offsetY,
    },
    rightTop = {
      x: configuration.startX + offsetX,
      y: configuration.startY + offsetY,
    },
    rightBottom = {
      x: configuration.startX + offsetX,
      y: configuration.startY - offsetY,
    },
    leftCenter = {
      x: configuration.startX - offsetX,
      y: configuration.startY,
    },
    rightCenter = {
      x: configuration.startX + offsetX,
      y: configuration.startY,
    },
    topCenter = {
      x: configuration.startX,
      y: configuration.startY + offsetY,
    },
    bottomCenter = {
      x: configuration.startX,
      y: configuration.startY - offsetY,
    };
  const positions = [
    leftTop,
    leftBottom,
    rightTop,
    rightBottom,
    leftCenter,
    rightCenter,
    topCenter,
    bottomCenter,
  ];
  return positions;
};

export const fetchXHRCookies = async (page: Page) => {
  let xhrCookie = "";
  let resolveFunction: (res: any) => void = () => {};

  // Create a Promise that will be resolved when the XHR request is detected
  const xhrPromise = new Promise((resolve) => {
    resolveFunction = resolve;
  });

  // Function to handle request events
  await page.setRequestInterception(true);
  const handleRequest = async (request: HTTPRequest) => {
    if (request.resourceType() === "xhr") {
      const requestHeaders = request.headers();
      if (requestHeaders["cookie"]) {
        xhrCookie = requestHeaders["cookie"];
        resolveFunction(true);
      }
    }
    request.continue();
  };

  page.on("request", handleRequest);

  // Navigate to map and trigger the initial position request
  const mapNavItem = await page.$("#navigation a.map");
  if (!mapNavItem) {
    serverLogger(LoggerLevels.ERROR, "Map navigation item not found");
    await page.setRequestInterception(false);
    page.removeAllListeners("request");
    throw new Error("Map navigation item not found");
  }

  try {
    await mapNavItem.click();
    await page.waitForSelector("#mapContainer", {
      visible: true,
      timeout: 4000,
    });
  } catch (e) {
    serverLogger(LoggerLevels.ERROR, "Failed to navigate to map");
    await page.setRequestInterception(false);
    page.removeAllListeners("request");
    throw new Error("Failed to navigate to map");
  }

  const mapContainer = await page.$("#mapContainer");
  if (!mapContainer) {
    serverLogger(LoggerLevels.ERROR, "Map container not found");
    await page.setRequestInterception(false);
    page.removeAllListeners("request");
    throw new Error("Map container not found");
  }

  const mapContainerBox = await mapContainer.boundingBox();
  if (!mapContainerBox) {
    serverLogger(LoggerLevels.ERROR, "Map container box not found");
    await page.setRequestInterception(false);
    page.removeAllListeners("request");
    throw new Error("Map container box not found");
  }

  // Hover over map container
  await page.mouse.move(
    mapContainerBox.x + mapContainerBox.width / 2,
    mapContainerBox.y + mapContainerBox.height / 2
  );

  // Wait for XHR request or a maximum timeout (5s)
  const timeout = setTimeout(() => {
    if (!xhrCookie) {
      serverLogger(
        LoggerLevels.WARN,
        "XHR request not detected or no cookie found within 5 seconds"
      );
    }
    resolveFunction(true);
  }, 5000);

  await xhrPromise;
  clearTimeout(timeout);

  // Cleanup event listeners and request interception
  await page.setRequestInterception(false);
  page.removeAllListeners("request");

  return xhrCookie;
};
