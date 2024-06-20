import { Page } from "puppeteer";
import { OasisAdditionalConfiguration } from "./oasisFarmer/types";
import { allAttackingOasis, getAttackingTroops, troopsConfig } from "./oasisFarmer/allTroops";
import { delay } from "../../utils";
import { createExplorationGrid, goToMapFetchBoundingBox } from "./oasisFarmer/oasisUtils";
import { startMovingMap } from "./oasisFarmer/mapMover";
import { getAllAttackingOasis } from "./oasisFarmer/getAttackingOasis";

export const startOasisFarmer = async (page: Page, travianDomain: string, config: OasisAdditionalConfiguration) => {
  // Get already attacking oasis
  const alreadyAttackingOasis = await getAllAttackingOasis(page, travianDomain);
  allAttackingOasis.push(...alreadyAttackingOasis);

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
  const { tribe, attackingTroops } = config;
  troopsConfig.selectedTribe = tribe;
  // For now lets just take single troop
  const attackingTroop = getAttackingTroops(tribe, attackingTroops);
  troopsConfig.selectedTroops.push(...attackingTroop);

  // Create exploration grid
  const maxTop = config.maxTop || 2,
    maxLeft = config.maxLeft || 2,
    maxRight = config.maxRight || 2,
    maxBottom = config.maxBottom || 2;

  const quadrantArray = createExplorationGrid(maxTop, maxBottom, maxLeft, maxRight);
  // Start moving the map
  const { grid, startX, startY } = quadrantArray;
  const { status, message } = await startMovingMap(page, grid, mapInfo, startX, startY);
  await page.logger(status, message);
  //console.log(grid);
  return;
};
