import { ElementHandle, Page } from "puppeteer";
import { delay } from "../../../utils";
import { allTroops } from "./allTroops";
import { clickNavigationSlot } from "../travianActions/clicker";
import { NavigationTypes } from "../villageBuilder/navigationSlots";
import { Tribes } from "./types";
import { UnitInfo } from "./lossCalculator";
import { OasisPosition } from "./dataFetching";
import { LoggerLevels } from "../../../config/logger";

export interface OasisRaidConfiguration extends OasisPosition {
  requiredTroops: number;
  attackingTroop: UnitInfo;
  tribe: Tribes;
}

export interface RaidStatus {
  status: boolean;
  terminate: boolean;
  message: string;
}

export const executeOasisRaid = async (
  page: Page,
  raidConfiguration: OasisRaidConfiguration
): Promise<RaidStatus> => {
  const {
    position: { x, y },
    requiredTroops,
    attackingTroop,
    tribe,
  } = raidConfiguration;

  if (!page.url().includes("karte.php")) {
    await clickNavigationSlot(page, NavigationTypes.MAP);
  }

  await delay(500, 600);
  // Write x coordinate
  const xCordInput = await page.$(".xCoord input");
  if (!xCordInput)
    return {
      status: false,
      terminate: false,
      message: "OASIS - x coordinate input not found",
    };
  await writeCoordiantes(page, x, xCordInput);

  // Write y coordinate
  const yCordInput = await page.$(".yCoord input");
  if (!yCordInput)
    return {
      status: false,
      terminate: false,
      message: "OASIS - y coordinate input not found",
    };
  await writeCoordiantes(page, y, yCordInput);

  // Click search button
  const OKButton = await page.$("#mapCoordEnter button");
  if (!OKButton)
    return {
      status: false,
      terminate: false,
      message: "OASIS - ok button not found",
    };
  await OKButton.click();
  await delay(1000, 1500);

  const mapContainer = await page.$("#mapContainer");
  if (!mapContainer)
    return {
      status: false,
      terminate: false,
      message: "OASIS - map container not found",
    };

  const mapContainerBox = await mapContainer.boundingBox();
  if (!mapContainerBox)
    return {
      status: false,
      terminate: false,
      message: "OASIS - map container box not found",
    };

  await page.mouse.move(
    mapContainerBox.x + mapContainerBox.width / 2,
    mapContainerBox.y + mapContainerBox.height / 2
  );
  await page.mouse.click(
    mapContainerBox.x + mapContainerBox.width / 2,
    mapContainerBox.y + mapContainerBox.height / 2
  );

  // await so popup is loaded
  await delay(697, 1102);

  const optionsContainer = await page.$(".detailImage .options");
  if (!optionsContainer)
    return {
      status: false,
      terminate: false,
      message: "OASIS - options container not found",
    };
  const options = await optionsContainer.$$(".option");

  let optionIndexWithBuild = -1;
  for (let option of options) {
    const optionText = await option.evaluate(
      (el) => el.querySelector("a")?.textContent
    );
    if (optionText?.includes("Raid unoccupied oasis")) {
      optionIndexWithBuild = options.indexOf(option);
      break;
    }
  }

  const raidButton = options[optionIndexWithBuild];
  if (!raidButton)
    return {
      status: false,
      terminate: false,
      message: "OASIS - raid button not found",
    };

  await raidButton.click();
  await page.waitForNavigation({ waitUntil: "networkidle2" });

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
        status: false,
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
      status: false,
      terminate: false,
      message: "OASIS - valid troop field not found",
    };

  // Check if there is enough troops to send
  const troopCount = await validTroopField.evaluate(
    (el: HTMLTableCellElement) => el.querySelector("a")?.textContent
  );

  if (!troopCount)
    return {
      status: false,
      terminate: true,
      message: "OASIS - troop count not found",
    };

  const parsedCount = parseInt(troopCount);
  console.log(parsedCount, requiredTroops);
  if (parsedCount < requiredTroops)
    return {
      status: false,
      terminate: true,
      message: "OASIS - not enough troops to execute raid, terminating loop...",
    };

  const inputField = await validTroopField.$("input");
  if (!inputField)
    return {
      status: false,
      terminate: false,
      message: "OASIS - input field not found",
    };

  await inputField.click();
  await inputField.type(requiredTroops.toString());

  // Click send button
  const sendButton = await page.$("form button.green");
  if (!sendButton)
    return {
      status: false,
      terminate: false,
      message: "OASIS - send button not found",
    };

  await sendButton.click();
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Confirm send
  const confirmButton = await page.$("button.rallyPointConfirm");
  if (!confirmButton)
    return {
      status: false,
      terminate: false,
      message: "OASIS - confirm button not found",
    };
  await confirmButton.click();

  await page.logger(
    LoggerLevels.SUCCESS,
    `Started raiding oasis at ${x}|${y} with ${requiredTroops} troops`
  );
  return {
    status: true,
    terminate: false,
    message: "OASIS - raid executed",
  };
};

export const writeCoordiantes = async (
  page: Page,
  coordinate: number,
  element: ElementHandle<Element>
) => {
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
