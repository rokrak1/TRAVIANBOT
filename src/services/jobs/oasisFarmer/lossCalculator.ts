import { OasisType } from "./fetchOasis";

export interface UnitInfo {
  name: string;
  offense: number;
  defenseInfantry: number;
  defenseCavalry: number;
  count: number;
  reward: number;
  upkeep: number;
  cost: {
    lumber: number;
    clay: number;
    iron: number;
    crop: number;
    total: number;
  };
  type?: string;
  level?: number;
  oasisType?: OasisType;
}

export function calculateRaidLosses(attackingUnits: UnitInfo[], defenderUnits: UnitInfo[]) {
  const unitType = attackingUnits[0].type === "infantry" ? "defenseInfantry" : "defenseCavalry";

  let totalOffense = attackingUnits.reduce((total, unit) => total + unit.count * unit.offense, 0);

  let totalDefense = defenderUnits.reduce((total, unit) => total + unit.count * unit[unitType], 0);
  let casualtyPercent: number;

  if (totalOffense > totalDefense) {
    let x = Math.pow(totalDefense / totalOffense, 1.5) * 100;
    casualtyPercent = (100 * x) / (100 + x);
  } else {
    console.log("Defense is too strong...");
    return;
  }

  // Calculate losses for each unit in the attacking army
  let losses = attackingUnits.map((unit) => {
    let unitLosses = Math.round(unit.count * (casualtyPercent / 100));
    return {
      unitName: unit.name,
      losses: unitLosses,
      lostResources: unit.cost.total * unitLosses,
    };
  });

  const totalResourcesLost = losses.reduce((total, unit) => total + unit.lostResources, 0);

  const totalUnitsLost = losses.reduce((total, unit) => total + unit.losses, 0);

  let deffLosses = defenderUnits.map((unit) => {
    let unitLosses = Math.round(unit.count * ((100 - casualtyPercent) / 100));
    return {
      unitName: unit.name,
      losses: unitLosses,
      reward: unit.reward * unitLosses,
    };
  });

  return {
    losses,
    deffLosses,
    totalResourcesLost,
    totalUnitsLost,
  };
}

export function calculateRequiredTroops(
  desiredCasualtyPercent: number,
  totalDefence: number,
  offenceSingleTroop: number
) {
  // Calculate z from the desired casualty percentage
  const z = desiredCasualtyPercent / (100 - desiredCasualtyPercent);

  // Calculate the equivalent (z)^(2/3) to adjust for the power 1.5 in the original equation
  const zAdjusted = Math.pow(z, 2 / 4);

  // Calculate the number of Troops required
  const requiredTroops = totalDefence / (offenceSingleTroop * zAdjusted);

  // Round up to ensure enough troops are used
  return Math.ceil(requiredTroops);
}

const calucalteOffenseBasedOnTroopLevel = (troop: UnitInfo, upkeep: number) => {
  const off = troop.offense;
  const level = troop.level!;
  const formula = off + (off + 300 * (upkeep / 7)) * (Math.pow(1.007, level) - 1);
  return formula;
};

export function calculateRequiredTroopsForMinimalLossAndTroopsUsed(attckTroop: UnitInfo, natureTroops: UnitInfo[]) {
  const attackingTroopOffenseWithLevel = calucalteOffenseBasedOnTroopLevel(attckTroop, attckTroop.upkeep);
  //console.log(attackingTroopOffenseWithLevel);
  const attackingTroop = {
    ...attckTroop,
    offense: parseFloat(attackingTroopOffenseWithLevel.toFixed(2)),
  } as UnitInfo;

  const unitType = attackingTroop.type === "infantry" ? "defenseInfantry" : "defenseCavalry";
  const totalDefence = natureTroops.reduce((total, u) => total + u.count * u[unitType], 0);
  const totalReward = natureTroops.reduce((total, u) => total + u.count * u.reward, 0);

  const offenceSingleTroop = attackingTroop.offense;

  const maxPercent = 0.7;
  const subtractor = 0.01;
  /*  console.log("OUT-totalDefence:", totalDefence);
  console.log("offenceSingleTroop:", offenceSingleTroop); */

  let troopsRequired = 0;
  for (let i = maxPercent; i > 0; i -= subtractor) {
    let requiredTroops = calculateRequiredTroops(i, totalDefence, offenceSingleTroop);
    const attackingTroopWithCount = {
      ...attackingTroop,
      count: requiredTroops,
    };
    const calculateLosses = calculateRaidLosses([attackingTroopWithCount], natureTroops);
    if (!calculateLosses) {
      continue;
    }

    const { totalResourcesLost, totalUnitsLost } = calculateLosses;
    /* console.log("requiredTroops:", requiredTroops);
    console.log("TotalUnitsLost:", totalUnitsLost); */
    let factor = totalReward < 4500 ? 0 : 4.2;
    const totalResourcesLostWithFactor = factor === 0 ? 0 : totalReward / factor;
    if (totalResourcesLost <= totalResourcesLostWithFactor) {
      troopsRequired = requiredTroops;
      /* console.log("totalResourcesLost:", totalResourcesLost);
      console.log("totalUnitsLost:", totalUnitsLost);
      console.log("totalReward:", totalReward); */
      return troopsRequired;
    }
  }
  return 0;
}
