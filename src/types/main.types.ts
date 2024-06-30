import { OasisType } from "../services/jobs/oasisFarmer/fetchOasis";
import { Tribes, Unit } from "../services/jobs/oasisFarmer/types";
import { RSlots } from "../services/jobs/villageBuilder/resourcesSlots";
import { CronIntervals } from "../utils/CronManager";

interface BotTypeConfiguration {
  interval: keyof typeof CronIntervals;
}

export interface Proxy {
  id: string;
  proxy_domain: string;
  proxy_username: string;
  proxy_password: string;
  proxy_name: string;
}

export interface ProxySupabase {
  id: string;
  proxy_username: string;
  proxy_password: string;
  proxy_domain: string;
  proxy_name: string;
  isAlive?: boolean;
}

export interface Bot {
  id: string;
  bot_configuration: BotConfiguration;
  image: string | null;
  name: string;
  created_at?: string;
  configuration_id: string;
  user_id: string;
  proxies?: ProxySupabase[];
}

export interface BotConfiguration {
  id: string;
  travian_username: string;
  travian_password: string;
  travian_domain: string;
  village_configuration: VillageConfiguration | null;
  farmer_configuration: FarmerConfiguration | null;
  oasis_farmer_configuration: OasisFarmerConfiguration | null;
  village_running: boolean;
  farmer_running: boolean;
  oasis_farmer_running: boolean;
}

export interface VillageConfiguration extends BotTypeConfiguration {
  config: VillageConfigurationType[];
}

export interface VillageConfigurationType {
  plan: PlanItem[];
  village: string;
}

export interface FarmerConfigurationType {
  krneki: string;
}

export interface FarmerConfiguration extends BotTypeConfiguration {
  config: FarmerConfigurationType;
}

export interface OasisFarmerConfigurationType {
  tribe: Tribes;
  maxTop: number;
  maxLeft: number;
  maxRight: number;
  maxBottom: number;
  attackingTroops: AttackingTroop[];
  selectedVillage: string;
}

export interface OasisFarmerConfiguration extends BotTypeConfiguration {
  config: OasisFarmerConfigurationType;
}

export interface AttackingTroop {
  name: Unit;
  type: OasisType;
  level: number;
}

export enum Slots {
  ALL_FIELDS = "ALL_FIELDS",
  WAREHOUSE = "WAREHOUSE",
  GRANARY = "GRANARY",
  BARRACKS = "BARRACKS",
  STABLE = "STABLE",
  WORKSHOP = "WORKSHOP",
  ACADEMY = "ACADEMY",
  SMITHY = "SMITHY",
  RALLY_POINT = "RALLY_POINT",
  MARKETPLACE = "MARKETPLACE",
  EMBASSY = "EMBASSY",
  CRANNY = "CRANNY",
  CITY_WALL = "CITY_WALL",
  RESIDENCE = "RESIDENCE",
  PALACE = "PALACE",
  TREASURY = "TREASURY",
  TRADE_OFFICE = "TRADE_OFFICE",
  GREAT_BARRACKS = "GREAT_BARRACKS",
  GREAT_STABLE = "GREAT_STABLE",
  CITY_HALL = "CITY_HALL",
  BRICKYARD = "BRICKYARD",
  SAWMILL = "SAWMILL",
  IRON_FOUNDRY = "IRON_FOUNDRY",
  GRAIN_MILL = "GRAIN_MILL",
  BAKERY = "BAKERY",
  TOURNAMENT_SQUARE = "TOURNAMENT_SQUARE",
  MAIN_BUILDING = "MAIN_BUILDING",
  HOSPITAL = "HOSPITAL",
  HERO_MANSION = "HERO'S_MANSION",
  TRAPPER = "TRAPPER",
  TOWN_HALL = "TOWN_HALL",
}

export enum PlanStatus {
  DONE = "DONE",
  UPGRADING = "UPGRADING",
  WAITING = "WAITING",
}

export interface PlanItem {
  id: number;
  slot: Slots | RSlots;
  level: number;
  status: PlanStatus;
}

export enum BotTypes {
  VILLAGE_BUILDER = "VILLAGE_BUILDER",
  FARMER = "FARMER",
  OASIS_FARMER = "OASIS_FARMER",
}
