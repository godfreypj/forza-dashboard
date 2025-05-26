// GeneralStats.ts
// General session and car info for Forza DASH packets

export class GeneralStats {
  isRaceOn: boolean;
  engineIdleRpm: number;
  driveTrain: number;
  numCylinders: number;
  carOrdinal: number;
  carClass: number;
  carPerformanceIndex: number;

  constructor(buffer: Buffer) {
    this.isRaceOn = buffer.readFloatLE(0) > 0;
    this.engineIdleRpm = buffer.readFloatLE(12);
    this.driveTrain = buffer.readUInt8(224);
    this.numCylinders = buffer.readUInt8(228);
    this.carOrdinal = buffer.readUInt8(212);
    this.carClass = buffer.readUInt8(216);
    this.carPerformanceIndex = buffer.readUInt8(220);
  }
}
