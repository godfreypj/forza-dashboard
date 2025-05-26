// LapStats.ts
// Per-lap and race progress for Forza DASH packets

export class LapStats {
  lap: number;
  bestLapTime: number;
  lastLapTime: number;

  constructor(buffer: Buffer) {
    this.lap = buffer.readUInt16LE(300);
    this.bestLapTime = buffer.readFloatLE(284);
    this.lastLapTime = buffer.readFloatLE(288);
  }
}
