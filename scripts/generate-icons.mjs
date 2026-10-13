/**
 * Generates the PWA icon PNGs.
 *
 * There is no image library in the dependency set, and adding one to draw two
 * flat icons is not worth it. A PNG is a small, well-specified format, so this
 * writes one directly: raw RGBA scanlines, zlib-compressed, wrapped in the
 * required chunks. Run with `node scripts/generate-icons.mjs`.
 *
 * The mark is a rounded brand-square with a white shopping bag — the same shape
 * as the `ShoppingBag` glyph used in the header, so the installed app icon and
 * the in-app cart agree.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public");

const BRAND = [217, 72, 15, 255]; // #d9480f, the --primary-solid token
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Each scanline is prefixed with a filter byte; 0 means "no filter".
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Signed distance to a rounded rectangle, used for both mark and background. */
function roundedRectSdf(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - radius;
}

/**
 * Draw one icon. Everything is computed in normalised units so the same code
 * renders 192px and 512px identically.
 */
function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const corner = size * 0.22;

  // Shopping bag geometry, as fractions of the canvas.
  const bagW = size * 0.34;
  const bagH = size * 0.3;
  const bagCy = cy + size * 0.055;
  const bagRadius = size * 0.05;
  const handleRadius = size * 0.088;
  const handleThickness = size * 0.032;

  const aa = 1; // one pixel of antialiasing

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;

      const bg = roundedRectSdf(px, py, cx, cy, size / 2, size / 2, corner);
      const bgAlpha = Math.min(1, Math.max(0, 0.5 - bg / aa));

      let colour = bgAlpha > 0 ? BRAND : CLEAR;

      if (bgAlpha > 0) {
        const bag = roundedRectSdf(px, py, cx, bagCy, bagW, bagH, bagRadius);
        const bagAlpha = Math.min(1, Math.max(0, 0.5 - bag / aa));

        // Handle: a stroked ring sitting on top of the bag body.
        const dHandle = Math.abs(Math.hypot(px - cx, py - (bagCy - bagH)) - handleRadius);
        const handleAlpha = Math.min(1, Math.max(0, 0.5 - (dHandle - handleThickness / 2) / aa));

        // Punch the bag body out of the handle ring so they read as one shape.
        const handleMask = Math.max(0, handleAlpha - bagAlpha);
        const white = Math.max(bagAlpha, handleMask);

        colour = [
          Math.round(BRAND[0] * (1 - white) + WHITE[0] * white),
          Math.round(BRAND[1] * (1 - white) + WHITE[1] * white),
          Math.round(BRAND[2] * (1 - white) + WHITE[2] * white),
          255,
        ];
      }

      const i = (y * size + x) * 4;
      rgba[i] = colour[0];
      rgba[i + 1] = colour[1];
      rgba[i + 2] = colour[2];
      rgba[i + 3] = colour[3];
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  const file = join(OUT, `icon-${size}.png`);
  writeFileSync(file, drawIcon(size));
  console.log(`wrote ${file}`);
}
