import { Page } from "puppeteer";
import { OasisAdditionalConfiguration } from "./types";
import {
  OasisPosition,
  createTileCatcher,
  fetchOasisFromPosition,
  fetchXHRCookies,
  getPositions,
} from "./dataFetching";
import { sortOasesByChebyshevDistance } from "./oasisMath";
import { delay } from "../../../utils";
import { LoggerLevels } from "../../../config/logger";

export const fetchOasis = async (
  page: Page,
  domain: string,
  configuration: OasisAdditionalConfiguration
): Promise<OasisPosition[]> => {
  // Get cookie from position request for fetching oasis json
  const xhrCookiee = await fetchXHRCookies(page);
  if (xhrCookiee) {
    await page.logger(LoggerLevels.INFO, "Cookie fetched successfully");
  }

  const tileCatcher = createTileCatcher(domain, xhrCookiee);

  const positions = getPositions(configuration);

  const allOasis = [];
  await page.logger(LoggerLevels.INFO, `Available positions: ${positions.map((p) => `[${p.x},${p.y}]`).join(", ")}`);
  for (const position of positions) {
    const availableOasis = await fetchOasisFromPosition(tileCatcher, position);
    if (!availableOasis) {
      continue;
    }
    allOasis.push(...availableOasis);
    await page.logger(
      LoggerLevels.SUCCESS,
      `Fetched ${availableOasis.length} oasis around ${position.x},${position.y}`
    );
    await delay(1000, 2000);
  }

  // Sort oases by Chebyshev distance
  const sortedOasis = sortOasesByChebyshevDistance({ x: configuration.startX, y: configuration.startY }, allOasis);

  const filterOutSameOasis = sortedOasis.filter(
    (oasis, index, self) =>
      index === self.findIndex((t) => t.position.x === oasis.position.x && t.position.y === oasis.position.y)
  );

  const validAnimals = ["Rat", "Spider", "Bat", "Wild Boar"];
  const mustIncludeAnimals = ["Rat", "Wild Boar"];
  // Get only "rich" oases (clay)
  const richOasis = filterOutSameOasis.filter((oasis) => {
    const animals = Object.keys(oasis.units);
    const hasInvalidAnimal = animals.some((animal) => !validAnimals.includes(animal));

    if (hasInvalidAnimal) {
      return false;
    }

    const hasRequiredAnimal = mustIncludeAnimals.every((animal) => animals.includes(animal));
    if (!hasRequiredAnimal) {
      return false;
    }

    return true;
  });
  return richOasis;
};

export const getOnlyNewOasis = (allOasis: OasisPosition[], newOasis: OasisPosition[]) => {
  return newOasis.filter((newOasis) => {
    return !allOasis.some(
      (oasis) => oasis.position.x === newOasis.position.x && oasis.position.y === newOasis.position.y
    );
  });
};

export const getRichOasis = (oasis: OasisPosition[]) => {
  const validAnimals = ["Rat", "Spider", "Bat", "Wild Boar"];
  const mustIncludeAnimals = ["Rat", "Wild Boar"];
  // Get only "rich" oases (clay)
  const richOasis = oasis.filter((oasis) => {
    const animals = Object.keys(oasis.units);
    const hasInvalidAnimal = animals.some((animal) => !validAnimals.includes(animal));

    if (hasInvalidAnimal) {
      return false;
    }

    const hasRequiredAnimal = mustIncludeAnimals.every((animal) => animals.includes(animal));
    if (!hasRequiredAnimal) {
      return false;
    }

    return true;
  });
  return richOasis;
};
