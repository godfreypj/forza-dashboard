/**
 * Forza DASH packet parsing utilities.
 * The DASH format gives velocity in meters/second (F32), so to get MPH:
 *   mph = sqrt(x^2 + y^2 + z^2) * 2.23694
 */

import fs from 'fs';
import { VehicleStats } from './models/VehicleStats.js';
import { LapStats } from './models/LapStats.js';
import { GeneralStats } from './models/GeneralStats.js';

function calculateMph(velocityX: number, velocityY: number, velocityZ: number): number {
  const speedMps = Math.sqrt(
    velocityX * velocityX +
    velocityY * velocityY +
    velocityZ * velocityZ
  );
  return speedMps * 2.23694;
}

// --- parseDashPacket: returns all stats grouped ---
export function parseDashPacket(buffer: Buffer) {
  return {
    general: new GeneralStats(buffer),
    lap: new LapStats(buffer),
    vehicle: new VehicleStats(buffer)
  };
}