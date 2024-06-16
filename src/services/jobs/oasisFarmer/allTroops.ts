import { OasisPosition } from "./dataFetching";
import { UnitInfo } from "./lossCalculator";
import { Tribes, Unit } from "./types";
import troops from "./troops.json";

export const oases: OasisPosition[] = [];
export const troopsConfig = {
  selectedTroops: [] as UnitInfo[],
  selectedTribe: Tribes.GAUL,
};

export const romanTroops = {
  Legionnaire: "u1",
  Praetorian: "u2",
  Imperian: "u3",
  "Equites Legati": "u4",
  "Equites Imperatoris": "u5",
  "Equites Caesaris": "u6",
  "Battering ram": "u7",
  "Fire Catapult": "u8",
  Senator: "u9",
  Settler: "u10",
};

export const teutonTroops = {
  Clubswinger: "u11",
  Spearman: "u12",
  Axeman: "u13",
  Scout: "u14",
  Paladin: "u15",
  "Teutonic Knight": "u16",
  Ram: "u17",
  Catapult: "u18",
  Chief: "u19",
  Settler: "u20",
};

export const gaulsTroops = {
  Phalanx: "u21",
  Swordsman: "u22",
  Pathfinder: "u23",
  "Theutates Thunder": "u24",
  Druidrider: "u25",
  Haeduan: "u26",
  Ram: "u27",
  Trebuchet: "u28",
  Chieftain: "u29",
  Settler: "u30",
};

export const animals = {
  Rat: "u31",
  Spider: "u32",
  Snake: "u33",
  Bat: "u34",
  "Wild Boar": "u35",
  Wolve: "u36",
  Bear: "u37",
  Crocodile: "u38",
  Tiger: "u39",
  Elephant: "u40",
};

export const allTroops = {
  Gauls: gaulsTroops,
  Teutons: teutonTroops,
  Romans: romanTroops,
  Animals: animals,
};

export const getAttackingTroop = (tribe: string, attackingTroop: { name: Unit; level: number }): UnitInfo => {
  const selectedUnits = troops.find((t) => t.tribe === tribe)?.units as unknown as UnitInfo[];
  if (!selectedUnits) {
    throw new Error("Tribe not found in troops.json");
  }

  const selectedTroop = selectedUnits.find((troop) => {
    return attackingTroop.name.includes(troop.name as Unit);
  });

  if (!selectedTroop) {
    throw new Error("Troop not found in troops.json");
  }

  return { ...selectedTroop, level: attackingTroop.level };
};

export const getAttackingTroops = (tribe: string, attackingTroops: { name: Unit; level: number }[]): UnitInfo[] => {
  return attackingTroops.map((attackingTroop) => getAttackingTroop(tribe, attackingTroop));
};

export const getNatureTroops = (oasis: OasisPosition) => {
  const natureUnits = troops.find((t) => t.tribe === "Nature")?.units as unknown as UnitInfo[];

  return Object.keys(oasis.units).map((unitName) => {
    return {
      ...natureUnits.find((unit) => unit.name === unitName),
      count: parseInt(oasis.units[unitName]),
    } as UnitInfo;
  });
};
