// sectors.ts
// Mini sector logic for Forza DASH telemetry

/**
 * MiniSectorManager
 * Handles mini sector timing, PBs, and deltas for a lap.
 */
export class MiniSectorManager {
  static miniSectorCount: number = 9; // 3 per sector
  static currentMiniSectorTimes: number[] = Array(9).fill(0);
  static bestMiniSectorTimes: number[] = Array(9).fill(Infinity);
  static lastMiniSectorDeltas: number[] = Array(9).fill(0);
  static lastMainSectorDeltas: number[] = Array(3).fill(0); // sum of completed mini sector deltas per sector
  static _currentMiniSectorStartTime: number = 0;
  static _currentMiniSector: number = 0;

  /**
   * Call this on each telemetry update to handle mini sector transitions and timing.
   * @param lapTime Current lap time (seconds)
   * @param lapDistance Current lap distance (meters)
   * @param trackLength Track length (meters)
   */
  static update(lapTime: number, lapDistance: number, trackLength: number) {
    const miniSectorLen = trackLength / MiniSectorManager.miniSectorCount;
    const currentMiniSector = Math.floor(lapDistance / miniSectorLen);
    if (MiniSectorManager._currentMiniSector !== currentMiniSector) {
      // Only if not first packet
      if (MiniSectorManager._currentMiniSector < MiniSectorManager.miniSectorCount && MiniSectorManager._currentMiniSectorStartTime > 0) {
        const idx = MiniSectorManager._currentMiniSector;
        const miniTime = lapTime - MiniSectorManager._currentMiniSectorStartTime;
        MiniSectorManager.currentMiniSectorTimes[idx] = miniTime;
        if (miniTime > 0 && (MiniSectorManager.bestMiniSectorTimes[idx] === Infinity || miniTime < MiniSectorManager.bestMiniSectorTimes[idx])) {
          MiniSectorManager.bestMiniSectorTimes[idx] = miniTime;
        }
        // Delta to PB for this mini sector
        const delta = MiniSectorManager.bestMiniSectorTimes[idx] !== Infinity ? miniTime - MiniSectorManager.bestMiniSectorTimes[idx] : 0;
        MiniSectorManager.lastMiniSectorDeltas[idx] = delta;
        // Update main sector delta (sum of completed mini sector deltas for this sector)
        const sectorIdx = Math.floor(idx / 3);
        const startMini = sectorIdx * 3;
        MiniSectorManager.lastMainSectorDeltas[sectorIdx] = MiniSectorManager.lastMiniSectorDeltas.slice(startMini, idx + 1).reduce((a, b) => a + b, 0);
      }
      MiniSectorManager._currentMiniSectorStartTime = lapTime;
      MiniSectorManager._currentMiniSector = currentMiniSector;
    }
  }

  /**
   * Reset all mini sector state (call on lap completion).
   * @param lapTime Current lap time (seconds)
   */
  static reset(lapTime: number) {
    MiniSectorManager.currentMiniSectorTimes = Array(9).fill(0);
    MiniSectorManager.lastMiniSectorDeltas = Array(9).fill(0);
    MiniSectorManager.lastMainSectorDeltas = Array(3).fill(0);
    MiniSectorManager._currentMiniSector = 0;
    MiniSectorManager._currentMiniSectorStartTime = lapTime;
  }

  /**
   * Get display info for each mini sector (time, best, delta).
   */
  static getMiniSectorDisplayInfo() {
    return Array.from({ length: MiniSectorManager.miniSectorCount }, (_, i) => ({
      time: MiniSectorManager.currentMiniSectorTimes[i],
      best: MiniSectorManager.bestMiniSectorTimes[i],
      delta: MiniSectorManager.lastMiniSectorDeltas[i],
    }));
  }

  /**
   * Get the main sector delta (sum of completed mini sector deltas for this sector).
   * Only updates at mini sector boundaries.
   * @param sectorIdx Sector index (0-based)
   */
  static getMainSectorDelta(sectorIdx: number) {
    return MiniSectorManager.lastMainSectorDeltas[sectorIdx];
  }
}
