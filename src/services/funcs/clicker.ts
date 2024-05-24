import { Page } from "puppeteer";
import { delay } from "../../utils";
import { NavigationTypes, navigationSlots } from "../slots/navigationSlots";
import { RSlots, rSlots } from "../slots/resourcesSlots";

export const clickNavigationSlot = async (
  page: Page,
  type?: NavigationTypes
) => {
  // Set some delay between click to avoid detection
  await delay(740, 2240);

  // If no type click random site
  if (!type) {
    const sitesArray = Object.keys(navigationSlots);
    const randomNumber0to10 = Math.floor(Math.random() * sitesArray.length);
    const randomSiteKey = sitesArray[
      Math.floor(randomNumber0to10)
    ] as NavigationTypes;
    await navigationSlots[randomSiteKey](page);
    return;
  }
  await navigationSlots[type](page);
};

export const clickResourceSlot = async (page: Page, type?: RSlots) => {
  // Set some delay between click to avoid detection
  await delay(740, 2240);

  // If no type click random site
  if (!type) {
    const sitesArray = Object.keys(rSlots);
    const randomNumber = Math.floor(Math.random() * sitesArray.length);
    const randomSiteKey = sitesArray[Math.floor(randomNumber)] as RSlots;
    await rSlots[randomSiteKey].click(page);
    return;
  }
  await rSlots[type].click(page);
};
