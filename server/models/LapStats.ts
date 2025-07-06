import { MiniSectorManager } from '../utils/sectors.js';

/**
 * LapStats
 * Per-lap and race progress for Forza DASH packets.
 *
 * This class tracks lap, sector, and mini sector timing, as well as personal bests and deltas.
 *
 * Consider splitting out mini sector logic and statistics utilities for maintainability.
 */
export class LapStats {
  /** Current lap number */
  lap: number;
  /** Best lap time (seconds) */
  bestLapTime: number;
  /** Last completed lap time (seconds) */
  lastLapTime: number;

  // --- Static state fields ---
  /** History of last N lap times */
  static lapHistory: number[] = [];
  static maxHistory: number = 10;
  static minDistance: number = Infinity;
  static maxDistance: number = -Infinity;
  static sectorCount: number = 3;
  static lastSectorTimes: number[] = [0, 0, 0]; // previous lap
  static currentSectorTimes: number[] = [0, 0, 0];
  static sectorCrossTimes: number[] = [0, 0, 0];
  static lastLapCompleted: number = 0;
  static lastLapEndDistance: number = 0;
  static initialDistance: number | null = null;
  static bestSectorTimes: number[] = [Infinity, Infinity, Infinity]; // personal bests for each sector
  static _lastLapTime: number = 0;  // Store the last lap time for sector 3 calculation
  static _currentSectorStartTime: number = 0;  // Track when we entered current sector

  // Use static get/set for trackLength and trackLengthReady to avoid property errors
  static _trackLength: number = 0;
  static _firstLapDone: boolean = false;
  static prevDistance: number = 0;
  static get trackLength() { return LapStats._trackLength; }
  static set trackLength(val: number) { LapStats._trackLength = val; }

  /**
   * Get the current sector index for a given distance.
   * @param distance Current lap distance
   * @returns Sector index (0-based) or null if not available
   */
  static getCurrentSector(distance: number): number | null {
    if (!LapStats.trackLength || !LapStats.initialDistance) return null;
    // Only start tracking sectors after crossing start line
    if (distance < 0) return null;
    const sectorLen = LapStats.trackLength / LapStats.sectorCount;
    return Math.floor((distance % LapStats.trackLength) / sectorLen);
  }

  /**
   * Parse lap stats from a Forza telemetry buffer.
   * Updates all static state for lap, sector, and mini sector timing.
   * @param buffer The UDP packet buffer
   */
  constructor(buffer: Buffer) {
    const rawLap = buffer.readUInt16LE(300);
    this.lap = rawLap;
    this.bestLapTime = buffer.readFloatLE(284);
    this.lastLapTime = buffer.readFloatLE(288);

    const lapTime = buffer.readFloatLE(292);
    const distance = buffer.readFloatLE(280);

    // On first packet with large negative distance, that's our lap length
    if (LapStats.initialDistance === null && distance < -100) {
      LapStats.initialDistance = distance;
      LapStats.trackLength = Math.abs(distance);
      return;
    }

    if (!LapStats.trackLength || !LapStats.initialDistance) return;
    if (distance < 0) return;

    const sectorLen = LapStats.trackLength / LapStats.sectorCount;
    const lapDistance = distance % LapStats.trackLength;
    const currentSector = Math.floor(lapDistance / sectorLen);

    // Mini sector logic (delegated)
    MiniSectorManager.update(lapTime, lapDistance, LapStats.trackLength);

    // Lap reset logic (on lap completion)
    if (lapDistance < LapStats.prevDistance && LapStats.prevDistance > LapStats.trackLength * 0.9) {
      MiniSectorManager.reset(lapTime);
    }

    LapStats._lastLapTime = lapTime;

    // Track sector transitions and times
    for (let i = 0; i < 2; i++) {
      const sectorEnd = (i + 1) * sectorLen;
      if (
        LapStats.sectorCrossTimes[i] === 0 && 
        lapDistance >= sectorEnd && 
        LapStats.prevDistance < sectorEnd
      ) {
        LapStats.sectorCrossTimes[i] = lapTime;
        const sectorTime = lapTime - (i === 0 ? 0 : LapStats.sectorCrossTimes[i - 1]);
        LapStats.currentSectorTimes[i] = sectorTime;
        if (!LapStats._firstLapDone || sectorTime < LapStats.bestSectorTimes[i]) {
          LapStats.bestSectorTimes[i] = sectorTime;
        }
        LapStats._currentSectorStartTime = lapTime;
      }
    }
    LapStats.prevDistance = lapDistance;
    if (this.lastLapTime > 0) {
      LapStats.lapHistory.push(this.lastLapTime);
      if (LapStats.lapHistory.length > LapStats.maxHistory) {
        LapStats.lapHistory.shift();
      }
    }
  }

  /**
   * Get the track length (meters).
   */
  static getTrackLength(): number {
    return LapStats.trackLength;
  }

  /**
   * Get the normalized distance (meters) from minDistance.
   * @param currentDistance Current distance
   */
  static getNormalizedDistance(currentDistance: number): number {
    if (LapStats.minDistance === Infinity) return 0;
    return currentDistance - LapStats.minDistance;
  }

  /**
   * Get the lap length (meters).
   */
  static getLapLength(): number {
    return LapStats.trackLength;
  }

  /**
   * Get current sector times for this lap.
   */
  static getCurrentSectorTimes() {
    return LapStats.currentSectorTimes;
  }

  /**
   * Get best sector times (PBs).
   */
  static getBestSectorTimes() {
    return LapStats.bestSectorTimes;
  }

  /**
   * Get last sector times (previous lap).
   */
  static getLastSectorTimes() {
    return LapStats.lastSectorTimes;
  }

  /**
   * Get sector deltas (current vs PB).
   */
  static getSectorDeltas() {
    return LapStats.currentSectorTimes.map((t, i) => {
      const best = LapStats.bestSectorTimes[i];
      if (t === 0 || best === Infinity) return null;
      return t - best;
    });
  }

  /**
   * Get display info for each sector (time and delta to PB).
   * @returns Array of { time, delta } for each sector
   */
  static getSectorDisplayInfo() {
    if (!LapStats.trackLength || !LapStats.initialDistance) {
      return Array(LapStats.sectorCount).fill({ time: 0, delta: null });
    }
    const currentSector = LapStats.getCurrentSector(LapStats.prevDistance);
    if (currentSector === null) return Array(LapStats.sectorCount).fill({ time: 0, delta: null });
    return LapStats.bestSectorTimes.map((bestTime, i) => {
      // For completed sectors in this lap
      if (LapStats.currentSectorTimes[i] > 0) {
        return {
          time: LapStats.currentSectorTimes[i],
          delta: bestTime !== Infinity ? LapStats.currentSectorTimes[i] - bestTime : null
        };
      }
      // For upcoming sectors
      return {
        time: bestTime === Infinity ? 0 : bestTime,
        delta: null
      };
    });
  }

  /**
   * Get display info for each mini sector (time, best, delta).
   * @returns Array of { time, best, delta } for each mini sector
   */
  static getMiniSectorDisplayInfo() {
    return MiniSectorManager.getMiniSectorDisplayInfo();
  }

  /**
   * Get the main sector delta (sum of completed mini sector deltas for this sector).
   * Only updates at mini sector boundaries.
   * @param sectorIdx Sector index (0-based)
   */
  static getMainSectorDelta(sectorIdx: number) {
    return MiniSectorManager.getMainSectorDelta(sectorIdx);
  }
}
//
// ---
//
// SUGGESTED REFACTOR:
//
// - Move mini sector logic (fields and related methods) to a LapMiniSectors helper class/module.
// - Move statistics/utility methods (getSectorDeltas, getSectorDisplayInfo, etc) to a LapStatsUtils module.
// - Keep LapStats focused on parsing and holding state for a single lap.
