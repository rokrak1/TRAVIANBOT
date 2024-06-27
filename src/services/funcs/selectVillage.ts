import { Page } from "puppeteer";
import { delay, randomBoundingBoxClickCoordinates } from "../../utils";
import WindMouse from "./windMouse";

export const selectVillage = async (page: Page, villageName: string) => {
  const villageList = await page.$$("#sidebarBoxVillagelist .villageList .dropContainer");

  let selectedVillage = null;
  for (let village of villageList) {
    const name = await village?.evaluate((el) => el.querySelector(".iconAndNameWrapper .name")?.textContent?.trim());

    if (name === villageName) {
      selectedVillage = await village.$(".iconAndNameWrapper");
      break;
    }
  }

  if (!selectedVillage) {
    console.log("Village not found");
    return;
  }

  const selectedVillageBbox = await selectedVillage.boundingBox();
  if (!selectedVillageBbox) {
    await selectedVillage.click();
  } else {
    const { x, y } = randomBoundingBoxClickCoordinates(selectedVillageBbox);
    await WindMouse.getInstance().mouseMoveAndClick(page, x, y);
    await page.mouse.click(x, y);
  }
  await delay(1000, 2000);

  return true;
};
