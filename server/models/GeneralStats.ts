// GeneralStats.ts
// General session and car info for Forza DASH packets

import fs from 'fs';
import path from 'path';

// Car lookup cache
let carLookup: Record<string, string> | null = null;
function getCarName(ordinal: number): string {
  if (!carLookup) {
    carLookup = {};
    // Use import.meta.url to resolve path in ESM
    // Always resolve relative to project root, not dist/
    const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
    const csvPath = path.join(projectRoot, 'data/cars.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    for (const line of csv.split('\n').slice(1)) {
      const [ord, name] = line.split(',');
      if (ord && name) carLookup[ord.trim()] = name.trim();
    }
  }
  return carLookup[ordinal] || String(ordinal);
}

// Car class lookup cache
let carClassLookup: Record<string, string> | null = null;
function getCarClassName(classOrdinal: number): string {
  if (!carClassLookup) {
    carClassLookup = {};
    const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
    const csvPath = path.join(projectRoot, 'data/carClass.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    for (const line of csv.split('\n').slice(1)) {
      const [ord, name] = line.split(',');
      if (ord && name) carClassLookup[ord.trim()] = name.trim();
    }
  }
  return carClassLookup[classOrdinal] || String(classOrdinal);
}

export class GeneralStats {
  isRaceOn: boolean;
  engineIdleRpm: number;
  driveTrain: number;
  numCylinders: number;
  carOrdinal: number;
  carClass: number;
  carPerformanceIndex: number;
  carName: string;
  carClassName: string;

  constructor(buffer: Buffer) {
    this.isRaceOn = buffer.readFloatLE(0) > 0;
    this.engineIdleRpm = buffer.readFloatLE(12);
    this.driveTrain = buffer.readUInt8(224);
    this.numCylinders = buffer.readUInt8(228);
    this.carOrdinal = buffer.readUInt16LE(212);
    this.carClass = buffer.readUInt8(216);
    this.carPerformanceIndex = buffer.readUInt8(220);
    this.carName = getCarName(this.carOrdinal);
    this.carClassName = getCarClassName(this.carClass);
  }
}
