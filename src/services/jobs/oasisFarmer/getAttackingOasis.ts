import { Page } from "puppeteer";
import { delay, randomBoundingBoxClickCoordinates } from "../../../utils";
import WindMouse from "../../funcs/windMouse";

const getOnlyUrl = (url: string) => {
  return "https://" + url.split("//")[1].split("/")[0];
};

const fetchAllAttackingOasis = async (page: Page) => {
  await page.waitForSelector("#content");
  const attacks = await page.$$("table");
  const alreadyAttackingOasis = [];
  for (let attack of attacks) {
    const attackInfo = await attack.evaluate((el) => {
      const parseValue = (resource: string): number => {
        // Remove all non-numeric characters except for digits and commas
        const cleanedResource = resource.replace(/[^\d,]/g, "").replace(/,/g, "");
        const value = parseInt(cleanedResource, 10);
        return value;
      };
      const coordinateX = el.querySelector(".coordinateX")?.textContent;
      if (!coordinateX) return;
      const coordinateY = el.querySelector(".coordinateY")?.textContent;
      if (!coordinateY) return;
      return {
        x: parseValue(coordinateX),
        y: parseValue(coordinateY),
      };
    });
    if (attackInfo) {
      alreadyAttackingOasis.push(attackInfo);
    }
  }
  return alreadyAttackingOasis;
};

export const getAllAttackingOasis = async (page: Page, travianDomain: string) => {
  const cleanUrl = getOnlyUrl(travianDomain);

  const outgoingAttacks = "a[href='/build.php?gid=16&tt=1&filter=2&subfilters=4']";
  const outgoingAttacksButton = await page.$(outgoingAttacks);

  if (!outgoingAttacksButton) {
    await page.goto(cleanUrl + "/build.php?gid=16&tt=1&filter=2&subfilters=4");
  } else {
    const bboxOutgoingAttacks = await outgoingAttacksButton.boundingBox();
    if (bboxOutgoingAttacks) {
      const { x, y } = randomBoundingBoxClickCoordinates(bboxOutgoingAttacks);
      await WindMouse.getInstance().mouseMoveAndClick(page, x, y);
    } else {
      await outgoingAttacksButton.click();
    }
  }

  const allAttackingOasis = [];
  while (true) {
    const alreadyAttackingOasis = await fetchAllAttackingOasis(page);
    allAttackingOasis.push(...alreadyAttackingOasis);

    const paginator = await page.$(".paginator");
    if (!paginator) {
      break;
    }

    const next = await paginator.$("a.next");
    if (!next) break;

    await next.click();
    await delay(1100, 1200);
  }
  return allAttackingOasis;
};
