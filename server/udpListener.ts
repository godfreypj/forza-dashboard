import dgram from 'dgram';
import fs from 'fs';
import { parseDashPacket } from './dataProcessing.js';
import { renderTelemetryState } from './utils/telemetryLogger.js';

const PORT = 9999;
const OUTPUT_PATH = '/home/philipgodfrey/dev/forza-dashboard/data/udp-packets.bin';
const CAPTURE_MODE = process.env.CAPTURE_MODE === '1';

const server = dgram.createSocket('udp4');

server.on('message', (msg) => {
  if (CAPTURE_MODE && msg.length === 331) {
    fs.appendFileSync(OUTPUT_PATH, msg);
  }
  // Process the packet and output telemetry
  if (msg.length === 331) {
    const stats = parseDashPacket(msg);
    renderTelemetryState(stats);
  }
});

server.bind(PORT);
