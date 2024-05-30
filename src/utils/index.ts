import fs from "fs";
import { Slots } from "../services/villageBuilder/csvSlots";

export const delay = async (min: number, max: number) => {
  const time = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((r) => setTimeout(r, time));
};

export const parseValue = (resource: string): number => {
  // Remove all non-numeric characters except for digits and commas
  const cleanedResource = resource.replace(/[^\d,]/g, "").replace(/,/g, "");
  const value = parseInt(cleanedResource, 10);
  return value;
};

export interface CSV_ROW {
  id: number;
  slot: Slots;
  level: string;
}

export const parseCSV = (filePath: string): Promise<CSV_ROW[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }

      // Split the data into rows
      const rows = data
        .split("\n")
        .map((row) => row.trim())
        .filter((row) => row.length > 0);
      if (rows.length === 0) {
        return resolve([]);
      }

      // Extract the headers
      const headers = rows[0].split(",").map((header) => header.trim());

      // Process each row into an object
      const result = rows.slice(1).map((row) => {
        const values = row.split(",").map((value) => value.trim());
        const obj = {} as { [key: string]: string };
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });

      resolve(result as unknown as CSV_ROW[]);
    });
  });
};

export const timeToSeconds = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds;
};
