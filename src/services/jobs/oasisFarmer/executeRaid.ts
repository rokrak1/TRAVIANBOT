import { ElementHandle, Page } from "puppeteer";
import { delay, parseValue } from "../../../utils";
import { allTroops, getNatureTroops, troopsConfig } from "./allTroops";
import { clickNavigationSlot } from "../travianActions/clicker";
import { NavigationTypes } from "../villageBuilder/navigationSlots";
import { Tribes } from "./types";
import { UnitInfo, calculateRequiredTroopsForMinimalLossAndTroopsUsed } from "./lossCalculator";
import { OasisPosition } from "./dataFetching";
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
  message: string;
}

const getRaidLink = async (page: Page) => {
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
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - raid link not found",
    };
  }
  const attackingTroop = troopsConfig.selectedTroops[0];
  const tribe = troopsConfig.selectedTribe;
  const natureTroops = getNatureTroops(oasis);
  const requiredTroops = calculateRequiredTroopsForMinimalLossAndTroopsUsed(attackingTroop, natureTroops);
  if (!requiredTroops) {
    return {
      status: LoggerLevels.ERROR,
      terminate: true,
      message: "OASIS - required troops not found",
    };
  }

  const maxTroops = 800;
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
      message: "OASIS - troop count not found, terminating loop...",
    };

  const parsedCount = parseValue(troopCount);
  const minTroopCount = attackingTroop.type === "infantry" ? 200 : 30;

  if (parsedCount < minTroopCount)
    return {
      status: LoggerLevels.ERROR,
      terminate: true,
      message: "OASIS - not enough troops to execute raid",
    };

  if (parsedCount < requiredTroops)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - not enough troops to execute raid, terminating loop...",
    };

  const inputField = await validTroopField.$("input");
  if (!inputField)
    return {
      status: LoggerLevels.ERROR,
      terminate: false,
      message: "OASIS - input field not found",
    };

  await inputField.click();
  await inputField.type(requiredTroops.toString());

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

  await page.logger(LoggerLevels.SUCCESS, `Started raiding oasis at ${x}|${y} with ${requiredTroops} troops`);
  return {
    status: LoggerLevels.SUCCESS,
    terminate: false,
    message: "OASIS - raid executed",
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
