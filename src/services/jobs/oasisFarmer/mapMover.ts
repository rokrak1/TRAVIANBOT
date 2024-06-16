import { Page } from "puppeteer";
import { delay } from "../../../utils";
import { humanLikeMouseMove } from "./humanLikeMove";
import { oases } from "./allTroops";
import { LoggerLevels } from "../../../config/logger";
import { createNewPageAndExecuteRaid } from "./executeRaid";

enum Moves {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  CENTER = "center",
}

interface MapInfo {
  centerX: number;
  centerY: number;
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
}

/**
 * Move the map in the specified direction
 * - Moves around map to fetch all oasis
 * - After moving it returns the cursor to the center
 */

const moveMouseAcrossMap = async (
  page: Page,
  centerX: number,
  centerY: number,
  mapWidth: number,
  mapX: number,
  mapHeight: number,
  mapY: number,
  offset: number
) => {
  await humanLikeMouseMove(page, centerX, centerY, mapX + offset, mapY + offset, false);
  await humanLikeMouseMove(page, mapX + offset, mapY + offset, mapX + offset, mapY + mapHeight - offset, false);
  await humanLikeMouseMove(
    page,
    mapX + offset,
    mapY + mapHeight - offset,
    mapX + mapWidth - offset,
    mapY + offset,
    false
  );
  await humanLikeMouseMove(
    page,
    mapX + mapWidth - offset,
    mapY + offset,
    mapX + mapWidth - offset,
    mapY + mapHeight - offset,
    false
  );
  await humanLikeMouseMove(page, mapX + mapWidth - offset, mapY + mapHeight - offset, centerX, centerY, false);
};

const moveMap = async (
  page: Page,
  move: Moves,
  { mapHeight, mapWidth, mapX, mapY, centerX, centerY }: MapInfo,
  isAlreadyExplored: boolean
) => {
  const offSet = 10;
  switch (move) {
    case Moves.UP:
      const upX = centerX + 25;
      const upY = mapY + offSet;
      await humanLikeMouseMove(page, centerX, centerY, upX, upY, false);
      await humanLikeMouseMove(page, upX, upY, upX, mapY + mapHeight - offSet, true);
      await humanLikeMouseMove(page, upX, mapY + mapHeight - offSet, centerX, centerY, false);
      break;
    case Moves.DOWN:
      const downX = centerX + 25;
      const downY = mapY + mapHeight - offSet;
      await humanLikeMouseMove(page, centerX, centerY, downX, downY, false);
      await humanLikeMouseMove(page, downX, downY, downX, mapY + offSet, true);
      await humanLikeMouseMove(page, downX, mapY + offSet, centerX, centerY, false);

      break;
    case Moves.LEFT:
      await humanLikeMouseMove(page, centerX, centerY, mapX + offSet, centerY, false);
      await humanLikeMouseMove(page, mapX + offSet, centerY, mapX + mapWidth - offSet, centerY, true);
      await humanLikeMouseMove(page, mapX + mapWidth - offSet, centerY, centerX, centerY, false);
      break;
    case Moves.RIGHT:
      await humanLikeMouseMove(page, centerX, centerY, mapX + mapWidth - offSet, centerY, false);
      await humanLikeMouseMove(page, mapX + mapWidth - offSet, centerY, mapX + offSet, centerY, true);
      await humanLikeMouseMove(page, mapX + offSet, centerY, centerX, centerY, false);
      break;
    case Moves.CENTER:
      await moveMouseAcrossMap(page, centerX, centerY, mapWidth, mapX, mapHeight, mapY, offSet);
  }
  if (isAlreadyExplored || move === Moves.CENTER) return;
  await moveMouseAcrossMap(page, centerX, centerY, mapWidth, mapX, mapHeight, mapY, offSet);
};

const findClosestUnvisitedPositionWithDirections = (currentX: number, currentY: number, grid: string[][]) => {
  let closest = null;
  let minDist = Infinity;
  let directions = [Moves.CENTER];

  if (grid[currentY][currentX] === "?") return { closest: { x: currentX, y: currentY }, directions };

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === "?") {
        const dist = Math.abs(currentX - x) + Math.abs(currentY - y);
        if (dist < minDist) {
          minDist = dist;
          closest = { x, y };

          // Calculate directions
          directions = [];
          let tempX = currentX;
          let tempY = currentY;

          while (tempX !== x || tempY !== y) {
            if (tempX < x) {
              directions.push(Moves.RIGHT);
              tempX++;
            } else if (tempX > x) {
              directions.push(Moves.LEFT);
              tempX--;
            }

            if (tempY < y) {
              directions.push(Moves.DOWN);
              tempY++;
            } else if (tempY > y) {
              directions.push(Moves.UP);
              tempY--;
            }
          }
        }
      }
    }
  }

  return { closest, directions };
};
interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface VisibleValue {
  bbox: BBox;
  width: number;
  value: number;
}

export const findVisibleXValues = async (page: Page, ruler: "x" | "y") => {
  const wOrH = ruler === "y" ? "height" : "width";
  const tOrL = ruler === "y" ? "top" : "left";
  const mapWidth = ruler === "y" ? 401 : 543;

  const rulerX = await page.$(`.ruler.${ruler} div`);
  if (!rulerX) return { message: "Ruler not found", values: [] };
  const { parentOffset } = await rulerX.evaluate((el, tOrL: any) => {
    return { parentOffset: parseFloat((el as HTMLDivElement).style[tOrL]) };
  }, tOrL);

  const rulerXValues = await rulerX?.$$("div");
  if (!rulerXValues) return { message: "Values not found", values: [] };
  const visibleXValues = await Promise.all(
    rulerXValues.map(async (el) => {
      const offsetChild = await el.evaluate((el, tOrL: any) => parseFloat((el as HTMLDivElement).style[tOrL]), tOrL);
      const width = await el.evaluate((el, wOrH: any) => parseFloat((el as HTMLDivElement).style[wOrH]), wOrH);
      const value = await el.evaluate((el) => (el as HTMLDivElement).innerText);

      if (offsetChild + width < -parentOffset) return null;
      if (offsetChild + width - -parentOffset < 10) return null;

      if (offsetChild > mapWidth + -parentOffset) return null;
      if (offsetChild + width - (mapWidth + -parentOffset) > 10) return null;

      const bbox = await el.boundingBox();
      if (!bbox) return null;
      return { bbox, width, value: parseInt(value) };
    })
  );
  const availableValues = visibleXValues.filter((v) => v !== null) as VisibleValue[];
  return { values: availableValues, offsetParent: parentOffset };
};

const getUnavailablePositions = async (page: Page) => {
  const outline = await page.$("#outline");
  if (!outline) return null;
  const mapCoordEnter = await page.$("#mapCoordEnter");
  if (!mapCoordEnter) return null;
  const toolbar = await page.$("#toolbar");
  if (!toolbar) return null;
  const minimapContainer = await page.$("#minimapContainer");
  if (!minimapContainer) return null;

  const outlineBbox = await outline.boundingBox();
  const mapCoordEnterBbox = await mapCoordEnter.boundingBox();
  const toolbarBbox = await toolbar.boundingBox();
  const minimapContainerBbox = await minimapContainer.boundingBox();
  return [outlineBbox, mapCoordEnterBbox, toolbarBbox, minimapContainerBbox];
};

interface ClickableSquares {
  x: number;
  y: number;
  clickPosition: { x: number; y: number };
}

const findVisibleValues = async (page: Page, mapInfo: MapInfo): Promise<ClickableSquares[]> => {
  const { values: xValues, offsetParent: xOffset } = await findVisibleXValues(page, "x");
  const { values: yValues, offsetParent: yOffset } = await findVisibleXValues(page, "y");

  const unavailablePositions = await getUnavailablePositions(page);

  if (!unavailablePositions || !xValues || !yValues) return [];

  const isPositionUnavailable = (x: number, y: number, bbox: BBox) => {
    return unavailablePositions.some((unavailable) => {
      if (!unavailable) return false;

      const intersectX = Math.max(
        0,
        Math.min(bbox.x + bbox.width, unavailable.x + unavailable.width) - Math.max(bbox.x, unavailable.x)
      );
      const intersectY = Math.max(
        0,
        Math.min(bbox.y + bbox.height, unavailable.y + unavailable.height) - Math.max(bbox.y, unavailable.y)
      );
      const intersectionArea = intersectX * intersectY;

      const bboxArea = bbox.width * bbox.height;
      return intersectionArea > bboxArea / 2;
    });
  };

  const mapBoundingBox = {
    x: mapInfo.mapX,
    y: mapInfo.mapY,
    width: mapInfo.mapWidth,
    height: mapInfo.mapHeight,
  };

  const adjustClickPosition = (x: number, y: number, bbox: BBox) => {
    const offset = 5;

    unavailablePositions.forEach((unavailable) => {
      if (!unavailable) return;

      if (x > unavailable.x && x < unavailable.x + unavailable.width) {
        x = x < unavailable.x + unavailable.width / 2 ? bbox.x + offset : bbox.x + bbox.width - offset;
      }

      if (y > unavailable.y && y < unavailable.y + unavailable.height) {
        y = y < unavailable.y + unavailable.height / 2 ? bbox.y + offset : bbox.y + bbox.height - offset;
      }
    });

    // Adjust based on map bounding box
    if (x < mapBoundingBox.x) x = mapBoundingBox.x + offset;
    if (x > mapBoundingBox.x + mapBoundingBox.width) x = mapBoundingBox.x + mapBoundingBox.width - offset;
    if (y < mapBoundingBox.y) y = mapBoundingBox.y + offset;
    if (y > mapBoundingBox.y + mapBoundingBox.height) y = mapBoundingBox.y + mapBoundingBox.height - offset;

    return { x, y };
  };

  const clickableSquares = [];

  for (const xValue of xValues) {
    for (const yValue of yValues) {
      const bbox = {
        x: xValue.bbox.x,
        y: yValue.bbox.y,
        width: xValue.bbox.width,
        height: yValue.bbox.height,
      };
      if (!isPositionUnavailable(xValue.value, yValue.value, bbox)) {
        let clickPosition = {
          x: bbox.x + bbox.width / 2,
          y: bbox.y + bbox.height / 2,
        };

        clickPosition = adjustClickPosition(clickPosition.x, clickPosition.y, bbox);

        clickableSquares.push({ x: xValue.value, y: yValue.value, clickPosition });
      }
    }
  }
  return clickableSquares;
};

const compareValuesAndClickOasis = async (page: Page, clickableSquares: ClickableSquares[]) => {
  for (const oasis of oases) {
    for (const clickableSquare of clickableSquares) {
      if (oasis.position.x === clickableSquare.x && oasis.position.y === clickableSquare.y && !oasis.wasSend) {
        await page.mouse.click(clickableSquare.clickPosition.x, clickableSquare.clickPosition.y);
        await delay(1000, 1200);

        const raidStatus = await createNewPageAndExecuteRaid(page, oasis);

        if (raidStatus.terminate) return raidStatus;

        const getCloseButton = await page.$(".dialogCancelButton");
        if (!getCloseButton) {
          await page.logger(LoggerLevels.ERROR, "No close button found");
          console.log("No close button found");
          return;
        }
        await getCloseButton.click();

        await delay(1000, 1100);
      }
    }
  }
};

export const startMovingMap = async (
  page: Page,
  grid: string[][],
  mapInfo: MapInfo,
  currentX: number,
  currentY: number
) => {
  while (grid.flat().includes("?")) {
    const { closest, directions } = findClosestUnvisitedPositionWithDirections(currentX, currentY, grid);
    if (!closest) {
      console.log("No more unvisited positions reachable");
      break;
    }

    for (let direction of directions) {
      switch (direction) {
        case Moves.UP:
          currentY--;
          break;
        case Moves.DOWN:
          currentY++;
          break;
        case Moves.LEFT:
          currentX--;
          break;
        case Moves.RIGHT:
          currentX++;
          break;
      }
      const isAlreadyExplored = grid[currentY][currentX] === "x";
      await moveMap(page, direction, mapInfo, isAlreadyExplored);
      grid[currentY][currentX] = "x";
    }
    const clickableSquares = await findVisibleValues(page, mapInfo);
    const raidStatus = await compareValuesAndClickOasis(page, clickableSquares);
    if (raidStatus?.terminate) return raidStatus;
  }

  console.log("Finished exploring");
  return {
    status: LoggerLevels.SUCCESS,
    terminate: false,
    message: "Finished exploring",
  };
};
