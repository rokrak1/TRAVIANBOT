import { Page } from "puppeteer";
import { elementClick } from "../../funcs/elementClick";

enum Resources {
  WOOD = "wood",
  IRON = "iron",
  CLAY = "clay",
  CROP = "crop",
}

export enum RSlots {
  WOOD1 = "WOOD1",
  WOOD2 = "WOOD2",
  WOOD3 = "WOOD3",
  WOOD4 = "WOOD4",
  CLAY1 = "CLAY1",
  CLAY2 = "CLAY2",
  CLAY3 = "CLAY3",
  CLAY4 = "CLAY4",
  IRON1 = "IRON1",
  IRON2 = "IRON2",
  IRON3 = "IRON3",
  IRON4 = "IRON4",
  CROP1 = "CROP1",
  CROP2 = "CROP2",
  CROP3 = "CROP3",
  CROP4 = "CROP4",
  CROP5 = "CROP5",
  CROP6 = "CROP6",
}

export const getSlotClassByName = (slot: RSlots) => {
  switch (slot) {
    case RSlots.WOOD1:
      return "buildingSlot1";
    case RSlots.WOOD2:
      return "buildingSlot3";
    case RSlots.WOOD3:
      return "buildingSlot14";
    case RSlots.WOOD4:
      return "buildingSlot17";
    case RSlots.IRON1:
      return "buildingSlot4";
    case RSlots.IRON2:
      return "buildingSlot7";
    case RSlots.IRON3:
      return "buildingSlot10";
    case RSlots.IRON4:
      return "buildingSlot11";
    case RSlots.CLAY1:
      return "buildingSlot5";
    case RSlots.CLAY2:
      return "buildingSlot6";
    case RSlots.CLAY3:
      return "buildingSlot16";
    case RSlots.CLAY4:
      return "buildingSlot18";
    case RSlots.CROP1:
      return "buildingSlot2";
    case RSlots.CROP2:
      return "buildingSlot8";
    case RSlots.CROP3:
      return "buildingSlot9";
    case RSlots.CROP4:
      return "buildingSlot15";
    case RSlots.CROP5:
      return "buildingSlot12";
    case RSlots.CROP6:
      return "buildingSlot13";
  }
};

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
