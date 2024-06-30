import { ElementHandle, Page } from "puppeteer";
import WindMouse from "./windMouse";
import { delay, randomCenteredBoundingBoxClickCoordinates } from "../../utils";

export const elementClick = async (page: Page, selector: ElementHandle<Element>, offset?: number) => {
  const boundingBox = await selector.boundingBox();
  if (boundingBox) {
    const { x, y } = randomCenteredBoundingBoxClickCoordinates(boundingBox, offset);
    await WindMouse.getInstance().mouseMoveAndClick(page, x, y);
    await delay(200, 300);
  } else {
    selector.click();
  }
};
