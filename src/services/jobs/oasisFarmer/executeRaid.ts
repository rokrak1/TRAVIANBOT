import { ElementHandle, Page } from "puppeteer";
import { delay, parseValue } from "../../../utils";
import { allTroops, getNatureTroops, troopsConfig } from "./allTroops";
import { Tribes } from "./types";
import { UnitInfo, calculateRequiredTroopsForMinimalLossAndTroopsUsed } from "./lossCalculator";
import { OasisPosition, OasisType } from "./fetchOasis";
import { LoggerLevels } from "../../../config/logger";
import { BrowserInstance } from "../../funcs/browserConfiguration";

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

  return raidButton.evaluate((el) => el.querySelector("a")?.href);
};

export const createNewPageAndExecuteRaid = async (page: Page, oasis: OasisPosition) => {
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

  const attackingTroop = troopsConfig.selectedTroops.find((troop) => troop.oasisType === oasis.type);

  if (!attackingTroop) {
    return { status: LoggerLevels.ERROR, terminate: false, message: "OASIS - attacking troop not found" };
  }

  const tribe = troopsConfig.selectedTribe;
  const natureTroops = getNatureTroops(oasis);
  const requiredTroops = calculateRequiredTroopsForMinimalLossAndTroopsUsed(attackingTroop, natureTroops);

  if (!requiredTroops) {
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: `OASIS (${oasis.position.x}|${oasis.position.y}) - required troops not found`,
    };
  }

  const maxTroops = attackingTroop.oasisType === OasisType.Rich ? 1200 : 10000;
  if (requiredTroops > maxTroops)
    return { status: LoggerLevels.ERROR, terminate: false, message: `OASIS - max troops value exceeded ${maxTroops}` };

  const raidConfiguration: OasisRaidConfiguration = {
    ...oasis,
    requiredTroops,
    attackingTroop,
    tribe,
  };

  // Open new tab
  const newPage = await BrowserInstance.getInstance().createPage();
  await newPage.goto(raidLink);
  try {
    await newPage.waitForSelector("#build", { timeout: 5000 });
  } catch (e) {
    await newPage.close();
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - build button not found",
    };
  }
  await delay(700, 800);

  const raidStatus = await executeOasisRaid(newPage, raidConfiguration);

  if (raidStatus.status === LoggerLevels.SUCCESS) {
    oasis.wasSend = true;
  }
  await newPage.close();

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
      status: LoggerLevels.ERROR,
      terminate: true,
      terminateOasis: attackingTroop.oasisType,
      message: "OASIS - troop count not found, terminating loop...",
    };

  const parsedCount = parseValue(troopCount);
  const minTroopCount = attackingTroop.type === "infantry" ? 500 : 50;

  if (parsedCount < minTroopCount)
    return {
      status: LoggerLevels.ERROR,
      terminate: true,
      terminateOasis: attackingTroop.oasisType,
      message: "OASIS - not enough troops to execute raid, terminating loop...",
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

  const minViableTroops = attackingTroop.type === "infantry" ? 300 : 40;
  const troopsToSend = requiredTroops < minViableTroops ? minViableTroops : requiredTroops;
  await inputField.click();
  await inputField.type(troopsToSend.toString());

  // Click send button
  const sendButton = await page.$("form button.green");
  if (!sendButton)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - send button not found",
    };

  await sendButton.click();
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Confirm send
  const confirmButton = await page.$("button.rallyPointConfirm");
  if (!confirmButton)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - confirm button not found",
    };
  await confirmButton.click();
  await delay(600, 700);
  return {
    status: LoggerLevels.SUCCESS,
    terminate: false,
    message: `Started raiding oasis at ${x}|${y} with ${requiredTroops} troops`,
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
