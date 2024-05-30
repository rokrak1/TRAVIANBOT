import { HTTPRequest, Page } from "puppeteer";
import { oasisApi } from "../utils";
import { LoggerLevels, serverLogger } from "../../config/logger";
import { delay } from "../../utils";
import { InternalAxiosRequestConfig } from "axios";
import { userAgent } from "../funcs/browserConfiguration";
import * as cheerio from "cheerio";

interface OasisFarmerConfiguration {
  startX: number;
  startY: number;
  maxX: number;
  maxY: number;
  minY: number;
  minX: number;
}

const animals = {
  Rats: "u31",
  Spiders: "u32",
  Snakes: "u33",
  Bats: "u34",
  "Wild Boars": "u35",
  Wolves: "u36",
  Bears: "u37",
  Crocodiles: "u38",
  Tigers: "u39",
  Elephants: "u40",
};

export const startOasisFarmer = async (
  page: Page,
  domain: string,
  additionalConfiguration: object
) => {
  const xhrCookiee = await fetchXHRCookies(page);
  const tileCatcher = createTileCatcher(domain, xhrCookiee);

  const configuration = additionalConfiguration as OasisFarmerConfiguration;
  const positions = getPositions(configuration);

  const allOasis = [];
  for (const position of positions) {
    const availableOasis = await fetchOasisFromPosition(tileCatcher, position);
    if (!availableOasis) {
      continue;
    }
    allOasis.push(...availableOasis);
    await delay(1000, 2000);
  }

  // TODO: Sort oasis by distance
  // TODO: Create loss calculation and smart troop selection
  console.log(allOasis);
};

interface Tile {
  position: { x: number; y: number };
  text: string;
}

interface OasisPosition {
  units: {
    [key: string]: string;
  };
  position: { x: number; y: number };
}

const fetchOasisFromPosition = async (
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

const createTileCatcher = (domain: string, cookie: string) => {
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

const getPositions = (configuration: OasisFarmerConfiguration) => {
  const offset = 30;
  const leftTop = {
      x: configuration.startX - offset,
      y: configuration.startY + offset,
    },
    leftBottom = {
      x: configuration.startX - offset,
      y: configuration.startY - offset,
    },
    rightTop = {
      x: configuration.startX + offset,
      y: configuration.startY + offset,
    },
    rightBottom = {
      x: configuration.startX + offset,
      y: configuration.startY - offset,
    },
    leftCenter = {
      x: configuration.startX - offset,
      y: configuration.startY,
    },
    rightCenter = {
      x: configuration.startX + offset,
      y: configuration.startY,
    },
    topCenter = {
      x: configuration.startX,
      y: configuration.startY + offset,
    },
    bottomCenter = {
      x: configuration.startX,
      y: configuration.startY - offset,
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

const fetchXHRCookies = async (page: Page) => {
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
