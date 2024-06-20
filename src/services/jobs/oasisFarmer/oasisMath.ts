import { OasisPosition } from "./fetchOasis";

interface VillageCords {
  x: number;
  y: number;
}

export function groupOasesByDistanceRange(village: VillageCords, oases: OasisPosition[]) {
  // Calculate distance and add it to each oasis
  oases.forEach((oasis) => {
    oasis.distance = Math.max(Math.abs(oasis.position.x - village.x), Math.abs(oasis.position.y - village.y));
  });

  // Distance ranges
  const ranges: {
    [key: string]: OasisPosition[];
  } = {
    "0-10": [],
    "10-20": [],
    "20-30": [],
    "30-40": [],
    "40-50": [],
  };

  // Group oases into ranges
  oases.forEach((oasis) => {
    const dist = oasis.distance!;
    let groupKeys = Object.keys(ranges).map((key) => key.split("-")[1]);

    for (let key of groupKeys) {
      if (dist <= parseInt(key)) {
        const prevRange = parseInt(key) - 10;
        ranges[`${prevRange}-${key}`].push(oasis);
        break;
      }
    }
  });

  // Sort each group asc
  for (let range in ranges) {
    ranges[range].sort((a, b) => a.distance! - b.distance!);
  }

  return ranges;
}

// Function to sort by Chebyshev distance
export function sortOasesByChebyshevDistance(village: { x: number; y: number }, oases: OasisPosition[]) {
  return oases.sort((a, b) => {
    const distA = Math.max(Math.abs(a.position.x - village.x), Math.abs(a.position.y - village.y));
    const distB = Math.max(Math.abs(b.position.x - village.x), Math.abs(b.position.y - village.y));
    return distA - distB; // Asc
  });
}
