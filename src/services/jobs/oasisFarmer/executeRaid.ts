import { ElementHandle, Page } from "puppeteer";
import { delay, parseValue, randomBoundingBoxClickCoordinates } from "../../../utils";
import { allTroops, getNatureTroops, troopsConfig } from "./allTroops";
import { Tribes } from "./types";
import { UnitInfo, calculateRequiredTroopsForMinimalLossAndTroopsUsed } from "./lossCalculator";
import { OasisPosition, OasisType } from "./fetchOasis";
import { LoggerLevels } from "../../../config/logger";
import { BrowserInstance } from "../../funcs/browserConfiguration";
import WindMouse from "../../funcs/windMouse";

export interface OasisRaidConfiguration extends OasisPosition {
  requiredTroops: number;
  attackingTroop: UnitInfo;
  tribe: Tribes;
}

export interface RaidStatus {
  status: LoggerLevels;
  terminate: boolean;
  terminateOasis?: OasisType;
  message: string;
}

const getRaidLink = async (page: Page) => {
  await page.waitForSelector(".detailImage .options", { timeout: 5000 });
  const optionsContainer = await page.$(".detailImage .options");
  if (!optionsContainer) {
    await page.logger(LoggerLevels.ERROR, "No options container found");
    console.log("No options container found");
    return null;
  }
  const options = await optionsContainer.$$(".option");

  if (!options?.length) {
    await page.logger(LoggerLevels.ERROR, "No options found");
    console.log("No options found");
    return null;
  }

  let optionIndexWithBuild = -1;
  for (let option of options) {
    const optionText = await option.evaluate((el) => el.querySelector("a")?.textContent);
    if (optionText?.includes("Raid unoccupied oasis")) {
      optionIndexWithBuild = options.indexOf(option);
      break;
    }
  }
  const raidButton = options[optionIndexWithBuild];
  if (!raidButton) {
    await page.logger(LoggerLevels.ERROR, "No raid button found");
    console.log("No raid button found");
    return null;
  }

  const raidBbox = await raidButton.boundingBox();
  const link = await raidButton.evaluate((el) => el.querySelector("a")?.href);
  if (!raidBbox) {
    await page.logger(LoggerLevels.ERROR, "No raid button bounding box found");
    console.log("No raid button bounding box found");
    return { bbox: null, link, ctrlClick: false };
  } else {
    return {
      bbox: randomBoundingBoxClickCoordinates(raidBbox),
      link,
      ctrlClick: true,
    };
  }
};

export const createNewPageAndExecuteRaid = async (page: Page, oasis: OasisPosition) => {
  const attackingTroop = troopsConfig.selectedTroops.find((troop) => troop.oasisType === oasis.type);

  if (!attackingTroop) {
    return { status: LoggerLevels.ERROR, terminate: false, message: "OASIS - attacking troop not found" };
  }

  const tribe = troopsConfig.selectedTribe;
  const natureTroops = getNatureTroops(oasis);
  const requiredTroops = calculateRequiredTroopsForMinimalLossAndTroopsUsed(attackingTroop, natureTroops);

  console.log("REQUIRED TROOPS: ", requiredTroops);
  if (!requiredTroops) {
    console.log("OASIS - required troops not found");
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: `OASIS (${oasis.position.x}|${oasis.position.y}) - required troops not found`,
    };
  }

  const maxTroops = attackingTroop.oasisType === OasisType.Rich ? 1500 : 12000;
  if (requiredTroops > maxTroops)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: `OASIS - max troops exceeded, ${maxTroops} of ${requiredTroops} (${oasis.position.x}|${oasis.position.y})`,
    };

  const raidConfiguration: OasisRaidConfiguration = {
    ...oasis,
    requiredTroops,
    attackingTroop,
    tribe,
  };

  // Get Url for raid
  const raidLink = await getRaidLink(page);
  if (!raidLink) {
    console.log("OASIS - raid link not found");
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - raid link not found",
    };
  }
  const { bbox, link, ctrlClick } = raidLink;
  let newPageRef = null;
  if (!ctrlClick && link) {
    newPageRef = await BrowserInstance.getInstance().createPage();
    newPageRef.goto(link);
  } else if (bbox) {
    await page.keyboard.down("Control");
    await WindMouse.getInstance().mouseMoveAndClick(page, bbox.x, bbox.y);
    await page.keyboard.up("Control");
    await delay(1000, 1100);
    const pages = await BrowserInstance.getInstance().getPages();

    if (pages.length === 1 && link) {
      newPageRef = await BrowserInstance.getInstance().createPage();
      newPageRef.goto(link);
    } else {
      newPageRef = pages[pages.length - 1];
      newPageRef.bringToFront();
    }
  }

  if (!newPageRef) {
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - new page not found",
    };
  }

  try {
    await newPageRef.waitForSelector("#build", { timeout: 5000 });
  } catch (e) {
    await newPageRef.close();
    await page.bringToFront();
    await delay(600, 650);
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - build button not found",
    };
  }
  await delay(700, 800);

  const raidStatus = await executeOasisRaid(newPageRef, raidConfiguration);

  if (raidStatus.status === LoggerLevels.SUCCESS) {
    oasis.wasSend = true;
  }
  await newPageRef.close();
  await page.bringToFront();
  await delay(600, 650);

  return raidStatus;
};

export const executeOasisRaid = async (page: Page, raidConfiguration: OasisRaidConfiguration): Promise<RaidStatus> => {
  const {
    position: { x, y },
    requiredTroops,
    attackingTroop,
    tribe,
  } = raidConfiguration;

  const troopsTd = await page.$$("#troops td");

  let validTroopField: any = null;
  const troopName = attackingTroop.name;

  //@ts-ignore
  const getTroopUID = allTroops[tribe][troopName];

  // Find valid field based on image class name which coorelates to troop UID
  for (let i = 0; i < troopsTd.length; i++) {
    const troopImg = await troopsTd[i].$("img");
    if (!troopImg)
      return {
        status: LoggerLevels.ERROR,
        terminate: false,
        message: "OASIS - troop image not found",
      };

    const troopClassName = await troopImg.evaluate((el) => el.className);
    if (troopClassName?.split(" ").pop() === getTroopUID) {
      validTroopField = troopsTd[i];
      break;
    }
  }

  if (!validTroopField)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - valid troop field not found",
    };

  // Check if there is enough troops to send
  const troopCount = await validTroopField.evaluate((el: HTMLTableCellElement) => el.querySelector("a")?.textContent);

  if (!troopCount)
    return {
      status: LoggerLevels.INFO,
      terminate: true,
      terminateOasis: undefined, // attackingTroop.oasisType,
      message: `OASIS - troop count not found, stopping ${attackingTroop.oasisType}...`,
    };

  const parsedCount = parseValue(troopCount);
  const minTroopCount = attackingTroop.type === "infantry" ? 500 : 60;

  if (parsedCount < minTroopCount)
    return {
      status: LoggerLevels.INFO,
      terminate: true,
      terminateOasis: undefined, //attackingTroop.oasisType,
      message: "OASIS - not enough troops to execute raid, stopping ${attackingTroop.oasisType}...",
    };

  if (parsedCount < requiredTroops)
    return {
      status: LoggerLevels.INFO,
      terminate: false,
      message: `OASIS - not enough troops (${parsedCount} of ${requiredTroops}) to execute raid at ${x}|${y}, skipping...`,
    };

  const inputField = await validTroopField.$("input");
  if (!inputField)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - input field not found",
    };

  const minViableTroops = attackingTroop.type === "infantry" ? 500 : 60;
  const troopsToSend = requiredTroops < minViableTroops ? minViableTroops : requiredTroops;

  const inputBbox = await inputField.boundingBox();

  if (!inputBbox) {
    await inputField.click();
  } else {
    const { x: inputX, y: inputY } = randomBoundingBoxClickCoordinates(inputBbox);
    await WindMouse.getInstance().mouseMoveAndClick(page, inputX, inputY);
  }

  for (let chat of troopsToSend.toString()) {
    await page.keyboard.type(chat);
    await delay(50, 100);
  }

  // Click send button
  const sendButton = await page.$("form button.green");
  if (!sendButton)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - send button not found",
    };

  const sendBbox = await sendButton.boundingBox();
  if (!sendBbox) {
    await sendButton.click();
  } else {
    const { x: sendX, y: sendY } = randomBoundingBoxClickCoordinates(sendBbox);
    await WindMouse.getInstance().mouseMoveAndClick(page, sendX, sendY);
  }
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Confirm send
  const confirmButton = await page.$("button.rallyPointConfirm");
  if (!confirmButton)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - confirm button not found",
    };

  const confirmBbox = await confirmButton.boundingBox();
  if (!confirmBbox) {
    await confirmButton.click();
  } else {
    const { x: confirmX, y: confirmY } = randomBoundingBoxClickCoordinates(confirmBbox);
    await WindMouse.getInstance().mouseMoveAndClick(page, confirmX, confirmY);
  }
  await delay(600, 700);
  return {
    status: LoggerLevels.SUCCESS,
    terminate: false,
    message: `Started raiding oasis at ${x}|${y} with ${troopsToSend} troops`,
  };
};

export const writeCoordiantes = async (page: Page, coordinate: number, element: ElementHandle<Element>) => {
  const inputValue = await element.evaluate((el: any) => el.value);
  await element.click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  for (let i = 0; i < inputValue.length; i++) {
    await page.keyboard.press("Backspace");
    await delay(187, 222);
  }
  await element.type(coordinate.toString());
};
