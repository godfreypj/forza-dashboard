// telemetryLogger.ts
// Utility for rendering telemetry state to the terminal in real time

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { LapStats } from '../models/LapStats.js';

let screen: blessed.Widgets.Screen | null = null;
let grid: any = null;
let lapBox: any = null;
let carBox: any = null;
let vehicleBox: any = null;
let debugBox: any = null;

/**
 * Set up the terminal dashboard UI using blessed and blessed-contrib.
 * Initializes the main grid and all stat boxes.
 */
function setupDashboard() {
  screen = blessed.screen({ smartCSR: true, title: 'Forza Dashboard' });
  grid = new contrib.grid({ rows: 12, cols: 12, screen });

  lapBox = grid.set(0, 0, 4, 4, blessed.box, { label: 'LapStats', tags: true, border: 'line', style: { border: { fg: 'cyan' } } });
  carBox = grid.set(0, 4, 4, 4, blessed.box, { label: 'GeneralStats', tags: true, border: 'line', style: { border: { fg: 'yellow' } } });
  vehicleBox = grid.set(0, 8, 4, 8, blessed.box, { label: 'VehicleStats', tags: true, border: 'line', style: { border: { fg: 'green' } }, width: '100%' });
  debugBox = grid.set(4, 0, 8, 12, blessed.box, { label: 'Debug', tags: true, border: 'line', style: { border: { fg: 'magenta' } }, scrollable: true, alwaysScroll: true, hidden: true, width: '100%' });

  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
}

/**
 * Render the current telemetry state to the dashboard UI.
 * @param state The parsed telemetry state object (general, vehicle, lap)
 */
export function renderTelemetryState(state: any) {
  if (!screen) setupDashboard();
  const debugMode = process.env.DEBUG_MODE === 'full';
  const general = state.general || {};
  const vehicle = state.vehicle || {};
  const lap = state.lap || {};

  // Mini sector and main sector delta display
  const miniSectorInfo = LapStats.getMiniSectorDisplayInfo();
  /**
   * Format a mini sector line for debug display.
   * @param i Mini sector index
   */
  function formatMiniSector(i: number) {
    const info = miniSectorInfo[i];
    let deltaStr = '';
    if (info.delta !== 0) {
      deltaStr = ` (${info.delta >= 0 ? '+' : ''}${info.delta.toFixed(2)}s)`;
    }
    return `mS${i+1}: {bold}${info.time ? info.time.toFixed(2) : '--'}{/bold}${deltaStr}`;
  }
  /**
   * Format a main sector delta line for display.
   * @param i Sector index
   */
  function formatMainSectorDelta(i: number) {
    const delta = LapStats.getMainSectorDelta(i);
    const sign = delta > 0 ? '+' : (delta < 0 ? '' : '');
    return `ΔS${i+1}: {bold}${sign}${delta.toFixed(2)}s{/bold}`;
  }

  // LapStats box (lap, bestLapTime, lastLapTime, main sector deltas only)
  lapBox.setContent(
    `lap: {bold}${lap.lap ?? ''}{/bold}\n` +
    `bestLapTime: {bold}${lap.bestLapTime ?? ''}{/bold}\n` +
    `lastLapTime: {bold}${lap.lastLapTime ?? ''}{/bold}\n` +
    `${formatMainSectorDelta(0)}\n` +
    `${formatMainSectorDelta(1)}\n` +
    `${formatMainSectorDelta(2)}`
  );

  /**
   * Get drivetrain name from value.
   * @param val Drivetrain code
   */
  function getDrivetrainName(val: number) {
    if (val === 0) return 'FWD';
    if (val === 1) return 'RWD';
    if (val === 2) return 'AWD';
    return String(val);
  }

  // GeneralStats box (main view: car, class, drivetrain, numCylinders)
  carBox.setContent(
    `Car: {bold}${general.carName ?? general.carOrdinal ?? ''}{/bold}\n` +
    `Class: {bold}${general.carClassName ?? general.carClass ?? ''}{/bold}\n` +
    `Drivetrain: {bold}${getDrivetrainName(general.driveTrain)}{/bold}\n` +
    `Cylinders: {bold}${general.numCylinders ?? ''}{/bold}`
  );

  /**
   * Format race time as MM:SS.mmm
   * @param secs Race time in seconds
   */
  function formatRaceTime(secs: number) {
    if (!secs || isNaN(secs)) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs - Math.floor(secs)) * 1000);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  // RPM color: orange 88–93%, green 94–96%, red 97%+
  let rpmStr = vehicle.rpm?.toFixed(0) ?? '';
  if (vehicle.engineMaxRpm) {
    const ratio = vehicle.rpm / vehicle.engineMaxRpm;
    if (ratio >= 0.97) {
      rpmStr = `{red-bg}{white-fg}${rpmStr}{/white-fg}{/red-bg}`;
    } else if (ratio >= 0.94) {
      rpmStr = `{green-bg}{black-fg}${rpmStr}{/black-fg}{/green-bg}`;
    } else if (ratio >= 0.88) {
      rpmStr = `{yellow-bg}{black-fg}${rpmStr}{/black-fg}{/yellow-bg}`;
    }
  }

  // Oversteer/Understeer detection
  let steerWarning = '';
  const frontSlip = Math.max(Math.abs(vehicle.tireSlipAngleFL ?? 0), Math.abs(vehicle.tireSlipAngleFR ?? 0));
  const rearSlip = Math.max(Math.abs(vehicle.tireSlipAngleRL ?? 0), Math.abs(vehicle.tireSlipAngleRR ?? 0));
  if (frontSlip > 1.0 && frontSlip > rearSlip) {
    steerWarning = '{yellow-bg}{black-fg} UNDERSTEER {/black-fg}{/yellow-bg}';
  } else if (rearSlip > 1.0 && rearSlip > frontSlip) {
    steerWarning = '{red-bg}{white-fg} OVERSTEER {/white-fg}{/red-bg}';
  }

  // VehicleStats box (main view: speedMph, rpm, gear, racePosition, currentLapTime, currentRaceTime, distance, steer warning)
  vehicleBox.setContent(
    `speedMph: {bold}${vehicle.speedMph?.toFixed(1) ?? ''}{/bold}\n` +
    `rpm: {bold}${rpmStr}{/bold}\n` +
    `gear: {bold}${vehicle.gear ?? ''}{/bold}\n` +
    `racePosition: {bold}${vehicle.racePosition ?? ''}{/bold}\n` +
    `currentLapTime: {bold}${vehicle.currentLapTime?.toFixed(3) ?? ''}{/bold}\n` +
    `currentRaceTime: {bold}${formatRaceTime(vehicle.currentRaceTime)}{/bold}\n` +
    `distance: {bold}${vehicle.distance?.toFixed(1) ?? ''}{/bold}\n` +
    (steerWarning ? `${steerWarning}\n` : '')
  );

  // Debug box (all values, only if DEBUG_MODE=full)
  if (debugMode) {
    debugBox.show();
    let debugContent = 'GeneralStats:\n';
    for (const [k, v] of Object.entries(general)) debugContent += `  ${k}: ${v}\n`;
    debugContent += '\nLapStats:\n';
    for (const [k, v] of Object.entries(lap)) debugContent += `  ${k}: ${v}\n`;
    // Mini sector times/deltas (compact)
    debugContent += '\nMiniSectors (time/delta):\n';
    for (let i = 0; i < 9; i += 3) {
      const ms = miniSectorInfo.slice(i, i+3).map((info, j) => {
        const idx = i + j;
        return `mS${idx+1}: ${info.time ? info.time.toFixed(2) : '--'} (${info.delta >= 0 ? '+' : ''}${info.delta.toFixed(2)})`;
      }).join('   ');
      debugContent += ms + '\n';
    }
    debugContent += '\nVehicleStats:\n';
    // Show all properties, split into three columns for better visibility
    const vehicleKeys = [
      ...Object.keys(vehicle),
      ...Object.getOwnPropertyNames(vehicle),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(vehicle))
    ];
    const seen = new Set();
    const uniqueKeys = vehicleKeys.filter(k => k !== 'constructor' && !seen.has(k) && seen.add(k));
    const colSize = Math.ceil(uniqueKeys.length / 3);
    const col1 = uniqueKeys.slice(0, colSize);
    const col2 = uniqueKeys.slice(colSize, colSize * 2);
    const col3 = uniqueKeys.slice(colSize * 2);
    function formatVal(val: any) {
      if (typeof val === 'number') {
        if (Math.abs(val) > 1000000 || Math.abs(val) < 0.000001 && val !== 0) return val.toExponential(3);
        return val.toFixed(6);
      }
      return String(val);
    }
    for (let i = 0; i < colSize; i++) {
      const l = col1[i];
      const m = col2[i];
      const r = col3[i];
      const lval = l ? `${l}: ${formatVal(vehicle[l])}` : '';
      const mval = m ? `${m}: ${formatVal(vehicle[m])}` : '';
      const rval = r ? `${r}: ${formatVal(vehicle[r])}` : '';
      debugContent += `${lval.padEnd(32)}${mval.padEnd(32)}${rval.padEnd(32)}\n`;
    }
    debugBox.setContent(debugContent);
  } else {
    debugBox.hide();
  }

  if (screen) screen.render();
}
