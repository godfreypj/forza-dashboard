# Forza Data Out Documentation

Forza Motorsport (2023) carries forward the technology from Forza Motorsport 7 that powers motion sleds, companion apps, and more. We call it **“Data Out”**, and players can configure it in-game to fit their needs. This page covers details of how to use and configure the feature.

---

## Overview

After being configured in-game, telemetry output sends data packets for use by external apps. This one-way UDP traffic is sent to a remote IP address at a rate of 60 packets per second. New to Forza Motorsport (2023), this functionality is now also available to the localhost address (`127.0.0.1`).

There are currently two packet formats that can be sent to the remote address, and they are identical to Forza Motorsport 7. The original data structure, **“Sled”**, was designed specifically for motion sleds. The second structure, **“Dash”**, contains all the Sled data as well as some extra data points.

---

## Configuration

The following settings can be configured in-game and are found under:

**SETTINGS > GAMEPLAY & HUD > “UDP RACE TELEMETRY” header:**

- **Data Out**: Toggles the data output function on and off. When set to `On`, data will begin to send as soon as the player gets onto a track.
- **Data Out IP Address**: The target IP address of the remote machine receiving data. The localhost address (`127.0.0.1`) is supported.
- **Data Out IP Port**: The target IP port of the remote machine receiving data. Be sure your app is listening on the same port and that firewall rules allow data on these ports to be received by your app.
- **Data Out Packet Format**: The format of the data to send, either **“Sled”** or **“Dash”**. See below for an outline of each format.

---

## Output Structures

### Type Notes

- **[Letter][Number]**: The letter defines the type, and the number defines the amount of bits used.
  - **S**: Signed Integer
  - **U**: Unsigned Integer
  - **F**: Floating Point

#### Examples:
- `S8`: A signed byte with potential values between `-128` and `127`.
- `F32`: A 32-bit floating point number, equivalent to `float/single`.

---

### Sled Packet Format

```c
// = 1 when race is on. = 0 when in menus/race stopped …
S32 IsRaceOn;

// Can overflow to 0 eventually
U32 TimestampMS;

F32 EngineMaxRpm;
F32 EngineIdleRpm;
F32 CurrentEngineRpm;

// In the car's local space; X = right, Y = up, Z = forward
F32 AccelerationX;
F32 AccelerationY;
F32 AccelerationZ;

// In the car's local space; X = right, Y = up, Z = forward
F32 VelocityX;
F32 VelocityY;
F32 VelocityZ;

// In the car's local space; X = pitch, Y = yaw, Z = roll
F32 AngularVelocityX;
F32 AngularVelocityY;
F32 AngularVelocityZ;

F32 Yaw;
F32 Pitch;
F32 Roll;

// Suspension travel normalized: 0.0f = max stretch; 1.0 = max compression
F32 NormalizedSuspensionTravelFrontLeft;
F32 NormalizedSuspensionTravelFrontRight;
F32 NormalizedSuspensionTravelRearLeft;
F32 NormalizedSuspensionTravelRearRight;

// Tire normalized slip ratio, = 0 means 100% grip and |ratio| > 1.0 means loss of grip.
F32 TireSlipRatioFrontLeft;
F32 TireSlipRatioFrontRight;
F32 TireSlipRatioRearLeft;
F32 TireSlipRatioRearRight;

// Wheels rotation speed radians/sec.
F32 WheelRotationSpeedFrontLeft;
F32 WheelRotationSpeedFrontRight;
F32 WheelRotationSpeedRearLeft;
F32 WheelRotationSpeedRearRight;

// = 1 when wheel is on rumble strip, = 0 when off.
S32 WheelOnRumbleStripFrontLeft;
S32 WheelOnRumbleStripFrontRight;
S32 WheelOnRumbleStripRearLeft;
S32 WheelOnRumbleStripRearRight;

// = from 0 to 1, where 1 is the deepest puddle
F32 WheelInPuddleDepthFrontLeft;
F32 WheelInPuddleDepthFrontRight;
F32 WheelInPuddleDepthRearLeft;
F32 WheelInPuddleDepthRearRight;

// Non-dimensional surface rumble values passed to controller force feedback
F32 SurfaceRumbleFrontLeft;
F32 SurfaceRumbleFrontRight;
F32 SurfaceRumbleRearLeft;
F32 SurfaceRumbleRearRight;

// Tire normalized slip angle, = 0 means 100% grip and |angle| > 1.0 means loss of grip.
F32 TireSlipAngleFrontLeft;
F32 TireSlipAngleFrontRight;
F32 TireSlipAngleRearLeft;
F32 TireSlipAngleRearRight;

// Tire normalized combined slip, = 0 means 100% grip and |slip| > 1.0 means loss of grip.
F32 TireCombinedSlipFrontLeft;
F32 TireCombinedSlipFrontRight;
F32 TireCombinedSlipRearLeft;
F32 TireCombinedSlipRearRight;

// Actual suspension travel in meters
F32 SuspensionTravelMetersFrontLeft;
F32 SuspensionTravelMetersFrontRight;
F32 SuspensionTravelMetersRearLeft;
F32 SuspensionTravelMetersRearRight;

// Unique ID of the car make/model
S32 CarOrdinal;

// Between 0 (D -- worst cars) and 7 (X class -- best cars) inclusive         
S32 CarClass;

// Between 100 (worst car) and 999 (best car) inclusive
S32 CarPerformanceIndex;

// 0 = FWD, 1 = RWD, 2 = AWD
S32 DrivetrainType;

// Number of cylinders in the engine
S32 NumCylinders;