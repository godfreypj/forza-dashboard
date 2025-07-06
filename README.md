# Forza Dashboard

A real-time telemetry dashboard for Forza Motorsport, built with Node.js and TypeScript. This app parses UDP telemetry packets from Forza, organizes the data into logical classes, and displays a live dashboard in your terminal using `blessed` and `blessed-contrib`.

## Features
- Real-time terminal dashboard for Forza telemetry
- Modern, interactive UI (no flicker, no scroll spam)
- Data organized into:
  - **GeneralStats**: Session and car info (e.g. isRaceOn, carOrdinal, carClass)
  - **LapStats**: Per-lap stats (lap, bestLapTime, lastLapTime)
  - **VehicleStats**: Live vehicle data (speed, rpm, acceleration, gear, power, torque, etc)
- **Advanced mini sector and sector delta logic** (see below)
- Debug mode to view all raw attributes
- Easy to extend and customize

## Mini Sector Timing & Sector Delta

- Each lap is divided into 3 sectors, and each sector is further divided into 3 mini sectors (9 mini sectors per lap).
- The dashboard displays main sector deltas, which only update at the end of each mini sector and remain fixed between updates.
- Mini sector times and deltas are available in debug mode for detailed analysis.
- No projections or running/interpolated values are shown—deltas are only updated at discrete mini sector boundaries.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the UDP listener:**
   ```bash
   npm run start:server
   # or
   node server/udpListener.js
   ```
   (Make sure your Forza game is sending UDP telemetry to this machine on the correct port.)

3. **View the dashboard:**
   - The terminal UI will launch automatically and update in real time.
   - Press `q` or `Ctrl+C` to quit.

4. **Debug mode:**
   - To see all raw telemetry attributes, run with:
     ```bash
     DEBUG_MODE=full npm run start:server
     ```

## Replay Mode

To replay previously captured telemetry:

1. **Run the replay script:**
   ```bash
   npm run replay
   # or
   node server/test/replayUdp.js
   ```

2. **Important:** When using replay mode, make sure to turn off capture mode in your configuration to avoid duplicate packet logging:
   - Set `CAPTURE_MODE=false` in your environment
   - Or comment out the capture logic in the server

This is useful for:
- Testing dashboard features without running Forza
- Analyzing specific racing scenarios
- Debugging telemetry processing

## Project Structure
- `server/models/` — TypeScript classes for each telemetry group
- `server/dataProcessing.ts` — UDP packet parsing and class mapping
- `server/udpListener.ts` — UDP server and dashboard entry point
- `server/utils/telemetryLogger.ts` — Terminal dashboard UI (blessed)
- `server/utils/sectors.ts` — Mini sector timing and delta logic
- `data/` — Example car data, logs, and UDP packet captures

## Requirements
- Node.js 18+
- Forza Motorsport (UDP telemetry enabled)

## Customization & Extending
- Mini sector logic is modularized in `server/utils/sectors.ts` for easy modification.
- Dashboard formatting and logic can be extended by editing `server/utils/telemetryLogger.ts`.
- Add new telemetry fields by updating the model classes in `server/models/`.

> **Note:** The "Cylinders" value shown is taken directly from Forza's UDP telemetry and may not reflect the real engine cylinder count for all cars. For accurate data, cross-reference with your own car database.

---

Enjoy your live Forza dashboard!

---
