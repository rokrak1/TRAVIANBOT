import { Page } from "puppeteer";
import { delay } from "../../utils";

export const selectVillage = async (page: Page, villageName: string) => {
  const villageList = await page.$$("#sidebarBoxVillagelist .villageList .dropContainer");

  let selectedVillage = null;
  for (let village of villageList) {
    const name = await village?.evaluate((el) =>
      el.querySelector(".coordinatesGrid")?.getAttribute("data-villagename")
    );

    if (name === villageName) {
      selectedVillage = village;
      break;
    }
  }

  if (!selectedVillage) {
    console.log("Village not found");
    return;
  }

  await selectedVillage.click();
  await delay(1000, 2000);

  return true;
};
