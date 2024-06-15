import { HTTPRequest, HTTPResponse, Page, Point } from "puppeteer";
import { OasisAdditionalConfiguration } from "./oasisFarmer/types";
import { calculateRequiredTroopsForMinimalLossAndTroopsUsed } from "./oasisFarmer/lossCalculator";
import { getAttackingTroop, getNatureTroops } from "./oasisFarmer/allTroops";
import { fetchOasis } from "./oasisFarmer/fetchOasis";
import { OasisRaidConfiguration, executeOasisRaid } from "./oasisFarmer/executeRaid";
import { LoggerLevels } from "../../config/logger";
import { delay } from "../../utils";
import { clickNavigationSlot } from "./travianActions/clicker";
import { NavigationTypes } from "./villageBuilder/navigationSlots";
import { OasisPosition, fetchOasisFromPositionNew } from "./oasisFarmer/dataFetching";
import { createExplorationGrid, getRandomInt, goToMapFetchBoundingBox } from "./oasisFarmer/oasisUtils";
import { humanLikeMouseMove } from "./oasisFarmer/humanLikeMove";
import { startMovingMap } from "./oasisFarmer/mapMover";

export const oases: OasisPosition[] = [];

export const startOasisFarmer = async (
  page: Page,
  domain: string,
  additionalConfiguration: OasisAdditionalConfiguration
) => {
  const mapInfo = await goToMapFetchBoundingBox(page);
  if (!mapInfo) return;

  const { centerX, centerY, mapX, mapY, mapWidth, mapHeight } = mapInfo;

  // Move the mouse to the map navigation
  await page.mouse.move(centerX, centerY);
  await delay(500, 801);

  // Zoom out the map
  await page.mouse.wheel({ deltaY: 100 });
  await delay(800, 1000);

  // Create exploration grid
  const maxTop = 2,
    maxLeft = 1,
    maxRight = 1,
    maxBottom = 0;

  const quadrantArray = createExplorationGrid(maxTop, maxBottom, maxLeft, maxRight);

  const { grid, startX, startY } = quadrantArray;
  await startMovingMap(page, grid, mapInfo, startX, startY);
  console.log(grid);
  return;
};

/**
 * 
 *  console.log(oases);
  return;
  await page.logger(LoggerLevels.INFO, "Starting oasis farmer");
  const configuration = additionalConfiguration as OasisAdditionalConfiguration;

  // Get oasis
  // Currently we only return clay oasis, this should be expanded also to wood and iron
  const richOasis = await fetchOasis(page, domain, configuration);
  await page.logger(LoggerLevels.INFO, `Found ${richOasis.length} rich oasis`);
  const first10Oasis = richOasis.slice(0, 10);

  // Get selected troops
  const { tribe, attackingTroops } = configuration;
  const attackingTroop = getAttackingTroop(tribe, attackingTroops);

  // Get required troops based on animals in oasis
  const oasisWithTroops: OasisRaidConfiguration[] = first10Oasis.map(
    (oasis) => {
      const natureTroops = getNatureTroops(oasis);
      const requiredTroops = calculateRequiredTroopsForMinimalLossAndTroopsUsed(
        attackingTroop,
        natureTroops
      );
      return {
        ...oasis,
        requiredTroops,
        attackingTroop,
        tribe,
      };
    }
  );

  let failedAttempts = 0;
  const maxFailedAttempts = 3;
  for (let oasis of oasisWithTroops) {
    const { status, terminate, message } = await executeOasisRaid(page, oasis);

    // Log error message and increase failed attempts
    if (!status) {
      failedAttempts++;
      await page.logger(LoggerLevels.ERROR, message);
    }

    // Terminate loop if we dont have enough troops
    if (terminate) break;

    // If we failed 3 times, terminate loop
    if (failedAttempts >= maxFailedAttempts) {
      await page.logger(
        LoggerLevels.ERROR,
        "Failed to raid oasis 3 times, terminating loop"
      );
      break;
    }
  }
 * 
 */
