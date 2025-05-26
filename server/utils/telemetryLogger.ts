// telemetryLogger.ts
// Utility for rendering telemetry state to the terminal in real time

import blessed from 'blessed';
import contrib from 'blessed-contrib';

let screen: blessed.Widgets.Screen | null = null;
let grid: any = null;
let lapBox: any = null;
let carBox: any = null;
let vehicleBox: any = null;
let debugBox: any = null;
let lastLapNumber: number | undefined = undefined;
let lastLapStats: any = {};

function setupDashboard() {
  screen = blessed.screen({ smartCSR: true, title: 'Forza Dashboard' });
  grid = new contrib.grid({ rows: 12, cols: 12, screen });

  lapBox = grid.set(0, 0, 4, 4, blessed.box, { label: 'LapStats', tags: true, border: 'line', style: { border: { fg: 'cyan' } } });
  carBox = grid.set(0, 4, 4, 4, blessed.box, { label: 'GeneralStats', tags: true, border: 'line', style: { border: { fg: 'yellow' } } });
  vehicleBox = grid.set(0, 8, 4, 4, blessed.box, { label: 'VehicleStats', tags: true, border: 'line', style: { border: { fg: 'green' } } });
  debugBox = grid.set(4, 0, 8, 12, blessed.box, { label: 'Debug', tags: true, border: 'line', style: { border: { fg: 'magenta' } }, scrollable: true, alwaysScroll: true, hidden: true });

  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
}

export function renderTelemetryState(state: any) {
  if (!screen) setupDashboard();
  const debugMode = process.env.DEBUG_MODE === 'full';
  const general = state.general || {};
  const vehicle = state.vehicle || {};
  const lap = state.lap || {};

  // LapStats box (main view: lap, bestLapTime, lastLapTime)
  lapBox.setContent(
    `lap: {bold}${lap.lap ?? ''}{/bold}\n` +
    `bestLapTime: {bold}${lap.bestLapTime ?? ''}{/bold}\n` +
    `lastLapTime: {bold}${lap.lastLapTime ?? ''}{/bold}`
  );

  // GeneralStats box (main view: isRaceOn, carOrdinal, carClass)
  carBox.setContent(
    `isRaceOn: {bold}${general.isRaceOn ?? ''}{/bold}\n` +
    `carOrdinal: {bold}${general.carOrdinal ?? ''}{/bold}\n` +
    `carClass: {bold}${general.carClass ?? ''}{/bold}`
  );

  // VehicleStats box (main view: speedMph, rpm, accelerationX/Y/Z, gear, power, torque)
  vehicleBox.setContent(
    `speedMph: {bold}${vehicle.speedMph?.toFixed(1) ?? ''}{/bold}\n` +
    `rpm: {bold}${vehicle.rpm?.toFixed(0) ?? ''}{/bold}\n` +
    `accelerationX: {bold}${vehicle.accelerationX ?? ''}{/bold}\n` +
    `accelerationY: {bold}${vehicle.accelerationY ?? ''}{/bold}\n` +
    `accelerationZ: {bold}${vehicle.accelerationZ ?? ''}{/bold}\n` +
    `gear: {bold}${vehicle.gear ?? ''}{/bold}\n` +
    `power: {bold}${vehicle.power ?? ''}{/bold}\n` +
    `torque: {bold}${vehicle.torque ?? ''}{/bold}`
  );

  // Debug box (all values, only if DEBUG_MODE=full)
  if (debugMode) {
    debugBox.show();
    let debugContent = 'GeneralStats:\n';
    for (const [k, v] of Object.entries(general)) debugContent += `  ${k}: ${v}\n`;
    debugContent += '\nLapStats:\n';
    for (const [k, v] of Object.entries(lap)) debugContent += `  ${k}: ${v}\n`;
    debugContent += '\nVehicleStats:\n';
    for (const [k, v] of Object.entries(vehicle)) debugContent += `  ${k}: ${v}\n`;
    debugBox.setContent(debugContent);
  } else {
    debugBox.hide();
  }

  if (screen) screen.render();
}
