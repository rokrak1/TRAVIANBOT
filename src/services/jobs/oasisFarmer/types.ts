export enum Tribes {
  ROMAN = "Romans",
  TEUTON = "Teutons",
  GAUL = "Gauls",
}

export enum RomanUnits {
  LEGIONNAIRE = "Legionnaire",
  PRAETORIAN = "Praetorian",
  IMPERIAN = "Imperian",
  EQUITES_LEGATI = "Equites Legati",
  EQUITES_IMPERATORIS = "Equites Imperatoris",
  EQUITES_CAESARIS = "Equites Caesaris",
  BATTERING_RAM = "Battering Ram",
  FIRE_CATAPULT = "Fire Catapult",
  SENATOR = "Senator",
  SETTLER = "Settler",
}

export enum TeutonUnits {
  CLUBSWINGER = "Clubswinger",
  SPEARMAN = "Spearman",
  AXEMAN = "Axeman",
  SCOUT = "Scout",
  PALADIN = "Paladin",
  TEUTONIC_KNIGHT = "Teutonic Knight",
  RAM = "Ram",
  CATAPULT = "Catapult",
  CHIEF = "Chief",
  SETTLER = "Settler",
}

export enum GaulUnits {
  PHALANX = "Phalanx",
  SWORDSMAN = "Swordsman",
  PATHFINDER = "Pathfinder",
  THEUTATES_THUNDER = "Theutates Thunder",
  DRUIDRIDER = "Druidrider",
  HAEDUAN = "Haeduan",
  RAM = "Ram",
  TREBUCHET = "Trebuchet",
  CHIEFTAIN = "Chieftain",
  SETTLER = "Settler",
}

export enum NatureUnits {
  RAT = "Rat",
  SPIDER = "Spider",
  SNAKE = "Snake",
  BAT = "Bat",
  WILD_BOAR = "Wild boar",
  WOLF = "Wolf",
  BEAR = "Bear",
  CROCODILE = "Crocodile",
  TIGER = "Tiger",
  ELEPHANT = "Elephant",
}

export type Unit = RomanUnits | TeutonUnits | GaulUnits;

export interface OasisAdditionalConfiguration {
  tribe: Tribes;
  attackingTroops: { name: Unit; level: number }[];
  startX: number;
  startY: number;
}
