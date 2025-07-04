// LapStats.ts
// Per-lap and race progress for Forza DASH packets

export class LapStats {
  lap: number;
  bestLapTime: number;
  lastLapTime: number;

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

  static getCurrentSector(distance: number): number | null {
    if (!LapStats.trackLength || !LapStats.initialDistance) return null;
    // Only start tracking sectors after crossing start line
    if (distance < 0) return null;
    
    const sectorLen = LapStats.trackLength / LapStats.sectorCount;
    return Math.floor((distance % LapStats.trackLength) / sectorLen);
  }

  // Add new static fields for velocity-based projections
  static _currentVelocity: number = 0;
  static _currentSectorStartDistance: number = 0;
  static _currentSectorLength: number = 0;

  constructor(buffer: Buffer) {
    const rawLap = buffer.readUInt16LE(300);
    this.lap = rawLap;
    this.bestLapTime = buffer.readFloatLE(284);
    this.lastLapTime = buffer.readFloatLE(288);

    const lapTime = buffer.readFloatLE(292);
    const distance = buffer.readFloatLE(280);
    // Get current velocity for projections (meters per second)
    LapStats._currentVelocity = buffer.readFloatLE(272);  // Velocity from Forza

    // On first packet with large negative distance, that's our lap length
    if (LapStats.initialDistance === null && distance < -100) {
      LapStats.initialDistance = distance;
      LapStats.trackLength = Math.abs(distance);
      LapStats._currentSectorLength = LapStats.trackLength / LapStats.sectorCount;
      return;
    }

    if (!LapStats.trackLength || !LapStats.initialDistance) return;
    if (distance < 0) return;

    const sectorLen = LapStats.trackLength / LapStats.sectorCount;
    const lapDistance = distance % LapStats.trackLength;
    const currentSector = Math.floor(lapDistance / sectorLen);

    // Check for sector transitions
    if (
      lapDistance < LapStats.prevDistance && 
      LapStats.prevDistance > sectorLen * (LapStats.sectorCount - 1)
    ) {
      // Save sector 3 if it wasn't saved yet
      if (LapStats.sectorCrossTimes[2] === 0) {
        const sectorTime = LapStats._lastLapTime - LapStats.sectorCrossTimes[1];
        LapStats.currentSectorTimes[2] = sectorTime;
        if (!LapStats._firstLapDone || sectorTime < LapStats.bestSectorTimes[2]) {
          LapStats.bestSectorTimes[2] = sectorTime;
        }
      }

      LapStats._firstLapDone = true;
      LapStats.lastSectorTimes = [...LapStats.currentSectorTimes];
      LapStats.currentSectorTimes = [0, 0, 0];
      LapStats.sectorCrossTimes = [0, 0, 0];
      LapStats._currentSectorStartTime = lapTime;
      LapStats._currentSectorStartDistance = lapDistance;
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
        LapStats._currentSectorStartDistance = lapDistance;
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

  // Utility to get lap consistency (stddev) and pace trend
  static getConsistency(): number {
    const arr = LapStats.lapHistory;
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }
  static getPaceTrend(): number {
    const arr = LapStats.lapHistory;
    if (arr.length < 2) return 0;
    // Simple trend: last - first
    return arr[arr.length - 1] - arr[0];
  }
  static getTrackLength(): number {
    return LapStats.trackLength;
  }
  static getNormalizedDistance(currentDistance: number): number {
    if (LapStats.minDistance === Infinity) return 0;
    return currentDistance - LapStats.minDistance;
  }
  static getLapLength(): number {
    return LapStats.trackLength;
  }
  static getCurrentSectorTimes() {
    return LapStats.currentSectorTimes;
  }
  static getBestSectorTimes() {
    return LapStats.bestSectorTimes;
  }
  static getLastSectorTimes() {
    return LapStats.lastSectorTimes;
  }
  // getSectorDeltas: always compare current sector time to best, even if sector is in progress
  static getSectorDeltas() {
    return LapStats.currentSectorTimes.map((t, i) => {
      const best = LapStats.bestSectorTimes[i];
      if (t === 0 || best === Infinity) return null;
      return t - best;
    });
  }

  // getSectorDisplayInfo: Show current/completed sector times with delta to PB
  static getSectorDisplayInfo() {
    if (!LapStats.trackLength || !LapStats.initialDistance) {
      return Array(LapStats.sectorCount).fill({ time: 0, delta: null });
    }

    const currentSector = LapStats.getCurrentSector(LapStats.prevDistance);
    if (currentSector === null) return Array(LapStats.sectorCount).fill({ time: 0, delta: null });

    const sectorLen = LapStats.trackLength / LapStats.sectorCount;
    
    return LapStats.bestSectorTimes.map((bestTime, i) => {
      // For current sector, calculate projected time based on velocity
      if (i === currentSector && LapStats._firstLapDone) {
        const elapsedTime = LapStats._lastLapTime - LapStats._currentSectorStartTime;
        const distanceTraveled = LapStats.prevDistance - LapStats._currentSectorStartDistance;
        const distanceRemaining = ((i + 1) * sectorLen) - (LapStats.prevDistance % LapStats.trackLength);
        
        // Project remaining time based on current velocity
        // Use a minimum velocity to avoid division by zero or unrealistic projections
        const minVelocity = 5; // 5 m/s minimum to avoid weird projections when nearly stopped
        const velocity = Math.max(Math.abs(LapStats._currentVelocity), minVelocity);
        const projectedRemainingTime = distanceRemaining / velocity;
        const projectedTotalTime = elapsedTime + projectedRemainingTime;

        const bestAtThisPoint = bestTime === Infinity ? 0 : bestTime;
        return {
          time: bestAtThisPoint,  // Show the best time for this sector
          delta: bestAtThisPoint ? (projectedTotalTime - bestAtThisPoint) : null
        };
      }
      
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
}
