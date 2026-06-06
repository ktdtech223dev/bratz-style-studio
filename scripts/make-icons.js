// scripts/make-icons.js
// Dependency-free PNG generator: deep-purple rounded square with a pastel heart.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '../public/icons');
fs.mkdirSync(OUT, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function makePNG(size) {
  const px = Buffer.alloc(size * size * 4);
  const r = size * 0.22; // corner radius
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // rounded-rect mask
      const dx = Math.max(r - x, x - (size - 1 - r), 0);
      const dy = Math.max(r - y, y - (size - 1 - r), 0);
      const inside = dx * dx + dy * dy <= r * r;
      if (!inside) {
        px[i] = 0;
        px[i + 1] = 0;
        px[i + 2] = 0;
        px[i + 3] = 0;
        continue;
      }
      // vertical gradient dusk purple -> navy
      const t = y / size;
      let R = lerp(0x3d, 0x1a, t);
      let G = lerp(0x34, 0x1f, t);
      let B = lerp(0x70, 0x4a, t);

      // heart, centered
      const hx = (x - size / 2) / (size * 0.34);
      const hy = -(y - size * 0.46) / (size * 0.34);
      const v = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
      if (v <= 0) {
        // pastel pink heart with soft top glow
        R = lerp(0xff, 0xf5, 0.2);
        G = lerp(0x6b, 0xa3, 0.2);
        B = lerp(0xa8, 0xc7, 0.2);
      }
      px[i] = R;
      px[i + 1] = G;
      px[i + 2] = B;
      px[i + 3] = 255;
    }
  }

  // filter (none) per scanline
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), makePNG(size));
}
console.log('icons generated');
