// PositionStats.ts
// Car and world position for Forza DASH packets

export class PositionStats {
  currentLapTime: number;
  currentRaceTime: number;
  racePosition: number;
  distance: number;

  constructor(buffer: Buffer) {
    this.currentLapTime = buffer.readFloatLE(292);
    this.currentRaceTime = buffer.readFloatLE(296);
    this.racePosition = buffer.readUInt8(302);
    this.distance = buffer.readFloatLE(280);
  }
}
