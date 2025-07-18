// VehicleStats.ts
// Real-time vehicle state for Forza DASH packets

export class VehicleStats {
  speedMph: number;
  rpm: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  yaw: number;
  pitch: number;
  roll: number;
  gear: number;
  steer: number;
  boost: number;
  fuel: number;
  power: number;
  torque: number;
  timestampMs: number;
  racePosition: number;
  currentLapTime: number;
  currentRaceTime: number;
  distance: number;
  engineMaxRpm: number;
  tireTempFL: number;
  tireTempFR: number;
  tireTempRL: number;
  tireTempRR: number;
  tireSlipAngleFL: number;
  tireSlipAngleFR: number;
  tireSlipAngleRL: number;
  tireSlipAngleRR: number;

  constructor(buffer: Buffer) {
    if (buffer.length < 331) throw new Error('DASH packet too small');
    this.timestampMs = buffer.readUInt32LE(4);
    this.accelerationX = buffer.readFloatLE(20);
    this.accelerationY = buffer.readFloatLE(24);
    this.accelerationZ = buffer.readFloatLE(28);
    this.velocityX = buffer.readFloatLE(32);
    this.velocityY = buffer.readFloatLE(36);
    this.velocityZ = buffer.readFloatLE(40);
    this.angularVelocityX = buffer.readFloatLE(44);
    this.angularVelocityY = buffer.readFloatLE(48);
    this.angularVelocityZ = buffer.readFloatLE(52);
    this.yaw = buffer.readFloatLE(56);
    this.pitch = buffer.readFloatLE(60);
    this.roll = buffer.readFloatLE(64);
    this.gear = buffer.readUInt8(307);
    this.steer = buffer.readInt8(308);
    this.boost = buffer.readFloatLE(272);
    this.fuel = buffer.readFloatLE(276);
    this.power = buffer.readFloatLE(248);
    this.torque = buffer.readFloatLE(252);
    this.speedMph = Math.sqrt(
      this.velocityX * this.velocityX +
      this.velocityY * this.velocityY +
      this.velocityZ * this.velocityZ
    ) * 2.23694;
    this.rpm = buffer.readFloatLE(16);
    this.engineMaxRpm = buffer.readFloatLE(8);
    this.racePosition = buffer.readUInt8(302);
    this.currentLapTime = buffer.readFloatLE(292);
    this.currentRaceTime = buffer.readFloatLE(296);
    this.distance = buffer.readFloatLE(280);
    this.tireTempFL = buffer.readFloatLE(256);
    this.tireTempFR = buffer.readFloatLE(260);
    this.tireTempRL = buffer.readFloatLE(264);
    this.tireTempRR = buffer.readFloatLE(268);
    this.tireSlipAngleFL = buffer.readFloatLE(164);
    this.tireSlipAngleFR = buffer.readFloatLE(168);
    this.tireSlipAngleRL = buffer.readFloatLE(172);
    this.tireSlipAngleRR = buffer.readFloatLE(176);
  }
}
