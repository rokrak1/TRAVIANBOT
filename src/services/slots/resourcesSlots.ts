import { Page } from "puppeteer";

enum Resources {
  WOOD = "wood",
  IRON = "iron",
  CLAY = "clay",
  CROP = "crop",
}

export enum RSlots {
  WOOD1 = "wood1",
  WOOD2 = "wood2",
  WOOD3 = "wood3",
  WOOD4 = "wood4",
  IRON1 = "iron1",
  IRON2 = "iron2",
  IRON3 = "iron3",
  IRON4 = "iron4",
  CLAY1 = "clay1",
  CLAY2 = "clay2",
  CLAY3 = "clay3",
  CLAY4 = "clay4",
  CROP1 = "crop1",
  CROP2 = "crop2",
  CROP3 = "crop3",
  CROP4 = "crop4",
  CROP5 = "crop5",
  CROP6 = "crop6",
}

export const rSlots = {
  [RSlots.WOOD1]: {
    buildingId: ".buildingSlot1",
    click: async (page: Page) => {
      await page.click(".buildingSlot1");
    },
  },
  [RSlots.WOOD2]: {
    buildingId: ".buildingSlot3",
    click: async (page: Page) => {
      await page.click(".buildingSlot3");
    },
  },
  [RSlots.WOOD3]: {
    buildingId: ".buildingSlot14",
    click: async (page: Page) => {
      await page.click(".buildingSlot14");
    },
  },
  [RSlots.WOOD4]: {
    buildingId: ".buildingSlot17",
    click: async (page: Page) => {
      await page.click(".buildingSlot17");
    },
  },
  [RSlots.IRON1]: {
    buildingId: ".buildingSlot4",
    click: async (page: Page) => {
      await page.click(".buildingSlot4");
    },
  },
  [RSlots.IRON2]: {
    buildingId: ".buildingSlot7",
    click: async (page: Page) => {
      await page.click(".buildingSlot7");
    },
  },
  [RSlots.IRON3]: {
    buildingId: ".buildingSlot10",
    click: async (page: Page) => {
      await page.click(".buildingSlot10");
    },
  },
  [RSlots.IRON4]: {
    buildingId: ".buildingSlot11",
    click: async (page: Page) => {
      await page.click(".buildingSlot11");
    },
  },
  [RSlots.CLAY1]: {
    buildingId: ".buildingSlot5",
    click: async (page: Page) => {
      await page.click(".buildingSlot5");
    },
  },
  [RSlots.CLAY2]: {
    buildingId: ".buildingSlot6",
    click: async (page: Page) => {
      await page.click(".buildingSlot6");
    },
  },
  [RSlots.CLAY3]: {
    buildingId: ".buildingSlot16",
    click: async (page: Page) => {
      await page.click(".buildingSlot16");
    },
  },
  [RSlots.CLAY4]: {
    buildingId: ".buildingSlot18",
    click: async (page: Page) => {
      await page.click(".buildingSlot18");
    },
  },
  [RSlots.CROP1]: {
    buildingId: ".buildingSlot2",
    click: async (page: Page) => {
      await page.click(".buildingSlot2");
    },
  },
  [RSlots.CROP2]: {
    buildingId: ".buildingSlot8",
    click: async (page: Page) => {
      await page.click(".buildingSlot8");
    },
  },
  [RSlots.CROP3]: {
    buildingId: ".buildingSlot9",
    click: async (page: Page) => {
      await page.click(".buildingSlot9");
    },
  },
  [RSlots.CROP4]: {
    buildingId: ".buildingSlot15",
    click: async (page: Page) => {
      await page.click(".buildingSlot15");
    },
  },
  [RSlots.CROP5]: {
    buildingId: ".buildingSlot12",
    click: async (page: Page) => {
      await page.click(".buildingSlot12");
    },
  },
  [RSlots.CROP6]: {
    buildingId: ".buildingSlot13",
    click: async (page: Page) => {
      await page.click(".buildingSlot13");
    },
  },
};
