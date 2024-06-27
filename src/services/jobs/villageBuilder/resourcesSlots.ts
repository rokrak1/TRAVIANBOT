import { Page } from "puppeteer";
import { elementClick } from "../../funcs/elementClick";

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
      const el = await page.$(".buildingSlot1");
      await elementClick(page, el!);
    },
  },
  [RSlots.WOOD2]: {
    buildingId: ".buildingSlot3",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot3");
      await elementClick(page, el!);
    },
  },
  [RSlots.WOOD3]: {
    buildingId: ".buildingSlot14",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot14");
      await elementClick(page, el!);
    },
  },
  [RSlots.WOOD4]: {
    buildingId: ".buildingSlot17",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot17");
      await elementClick(page, el!);
    },
  },
  [RSlots.IRON1]: {
    buildingId: ".buildingSlot4",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot4");
      await elementClick(page, el!);
    },
  },
  [RSlots.IRON2]: {
    buildingId: ".buildingSlot7",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot7");
      await elementClick(page, el!);
    },
  },
  [RSlots.IRON3]: {
    buildingId: ".buildingSlot10",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot10");
      await elementClick(page, el!);
    },
  },
  [RSlots.IRON4]: {
    buildingId: ".buildingSlot11",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot11");
      await elementClick(page, el!);
    },
  },
  [RSlots.CLAY1]: {
    buildingId: ".buildingSlot5",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot5");
      await elementClick(page, el!);
    },
  },
  [RSlots.CLAY2]: {
    buildingId: ".buildingSlot6",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot6");
      await elementClick(page, el!);
    },
  },
  [RSlots.CLAY3]: {
    buildingId: ".buildingSlot16",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot16");
      await elementClick(page, el!);
    },
  },
  [RSlots.CLAY4]: {
    buildingId: ".buildingSlot18",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot18");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP1]: {
    buildingId: ".buildingSlot2",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot2");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP2]: {
    buildingId: ".buildingSlot8",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot8");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP3]: {
    buildingId: ".buildingSlot9",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot9");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP4]: {
    buildingId: ".buildingSlot15",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot15");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP5]: {
    buildingId: ".buildingSlot12",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot12");
      await elementClick(page, el!);
    },
  },
  [RSlots.CROP6]: {
    buildingId: ".buildingSlot13",
    click: async (page: Page) => {
      const el = await page.$(".buildingSlot13");
      await elementClick(page, el!);
    },
  },
};
