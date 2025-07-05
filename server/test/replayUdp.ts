import * as dgram from 'dgram';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURE THESE ---
const PACKET_SIZE = 331; // DASH packet size for FM2023
const INTERVAL_MS = 16;
const UDP_PORT = 9999;
const UDP_HOST = '127.0.0.1';

// --- PATH TO YOUR CAPTURE FILE ---
const capturePath = path.resolve(process.cwd(), 'data/udp-packets.bin');

// --- READ THE CAPTURED DATA ---
const data = fs.readFileSync(capturePath);
const client = dgram.createSocket('udp4');

let offset = 0;
function sendNext() {
  if (offset + PACKET_SIZE > data.length) {
    offset = 0;
  }
  const packet = data.slice(offset, offset + PACKET_SIZE);
  client.send(packet, UDP_PORT, UDP_HOST, (err) => {
    if (err) console.error('UDP send error:', err);
  });
  offset += PACKET_SIZE;
  setTimeout(sendNext, INTERVAL_MS);
}

console.log('Beep boop.')
console.log('Replaying UDP packets..:)');
sendNext();