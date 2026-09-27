import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

function createPngBuffer(size, r, g, b) {
  // Create an uncompressed RGBA image buffer
  const rawData = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  
  for (let y = 0; y < size; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < size; x++) {
      // Draw a rounded rectangle / green icon effect
      const dx = x - size / 2;
      const dy = y - size / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = size * 0.45;
      
      let pr = r, pg = g, pb = b, alpha = 255;
      if (dist < radius * 0.6) {
        // Center icon highlight (green)
        pr = 0x78; pg = 0xa4; pb = 0x49;
      }
      
      rawData[offset++] = pr;
      rawData[offset++] = pg;
      rawData[offset++] = pb;
      rawData[offset++] = alpha;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  
  const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcBuf);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Standard CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let code = buf[i];
    crc ^= code;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

console.log('Generating PNG PWA icons...');
const png192 = createPngBuffer(192, 0xed, 0xf6, 0xdf);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
console.log('Saved public/icon-192.png');

const png512 = createPngBuffer(512, 0xed, 0xf6, 0xdf);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
console.log('Saved public/icon-512.png');

console.log('PNG PWA icons created successfully!');
