import { Page } from "puppeteer";
import { OasisAdditionalConfiguration } from "./oasisFarmer/types";
import { getAttackingTroop, troopsConfig } from "./oasisFarmer/allTroops";
import { delay } from "../../utils";
import { createExplorationGrid, goToMapFetchBoundingBox } from "./oasisFarmer/oasisUtils";
import { startMovingMap } from "./oasisFarmer/mapMover";

export const startOasisFarmer = async (page: Page, additionalConfiguration: OasisAdditionalConfiguration) => {
  const mapInfo = await goToMapFetchBoundingBox(page);
  if (!mapInfo) return;

  // Move the mouse to the map navigation
  const { centerX, centerY } = mapInfo;
  await page.mouse.move(centerX, centerY);
  await delay(500, 801);

  // Zoom out the map
  await page.mouse.wheel({ deltaY: 100 });
  await delay(800, 1000);

  // Get attacking troop
  const { tribe, attackingTroops } = additionalConfiguration;
  troopsConfig.selectedTribe = tribe;
  // For now lets just take single troop
  const attackingTroop = getAttackingTroop(tribe, attackingTroops[0]);
  troopsConfig.selectedTroops.push(attackingTroop);

  // Create exploration grid
  const maxTop = 3,
    maxLeft = 3,
    maxRight = 3,
    maxBottom = 1;

  const quadrantArray = createExplorationGrid(maxTop, maxBottom, maxLeft, maxRight);
  // Start moving the map
  const { grid, startX, startY } = quadrantArray;
  const { status, message } = await startMovingMap(page, grid, mapInfo, startX, startY);
  await page.logger(status, message);
  //console.log(grid);
  return;
};
