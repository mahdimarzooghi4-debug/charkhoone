const fs = require("node:fs");
const path = require("node:path");
const { deflateSync, inflateSync } = require("node:zlib");

const ICON_SIZE = 256;
const ICON_SCALE = 0.68;
const BRAND_BACKGROUND = [13, 59, 54, 255];

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function decodeRgbaPng(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!png.subarray(0, 8).equals(signature)) throw new Error("Charkhoone icon source is not a PNG");

  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const imageData = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      imageData.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error("Charkhoone icon source must be a non-interlaced 8-bit RGBA PNG");
  }

  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  const filtered = inflateSync(Buffer.concat(imageData));
  const pixels = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y += 1) {
    const inputRow = y * (rowBytes + 1);
    const outputRow = y * rowBytes;
    const filter = filtered[inputRow];
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = filtered[inputRow + x + 1];
      const left = x >= bytesPerPixel ? pixels[outputRow + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[outputRow + x - rowBytes] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[outputRow + x - rowBytes - bytesPerPixel] : 0;
      let predictor = 0;

      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) predictor = paethPredictor(left, up, upLeft);
      else if (filter !== 0) throw new Error("Unsupported PNG row filter in Charkhoone icon");

      pixels[outputRow + x] = (raw + predictor) & 255;
    }
  }

  return { width, height, pixels };
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  typeBytes.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), data.length + 8);
  return result;
}

function createPaddedIcon(source, background) {
  const canvas = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
  if (background) {
    for (let pixel = 0; pixel < ICON_SIZE * ICON_SIZE; pixel += 1) {
      const index = pixel * 4;
      canvas[index] = background[0];
      canvas[index + 1] = background[1];
      canvas[index + 2] = background[2];
      canvas[index + 3] = background[3];
    }
  }

  const targetSize = Math.round(ICON_SIZE * ICON_SCALE);
  const inset = Math.floor((ICON_SIZE - targetSize) / 2);
  for (let y = 0; y < targetSize; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor(y * source.height / targetSize));
    for (let x = 0; x < targetSize; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor(x * source.width / targetSize));
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const targetIndex = ((inset + y) * ICON_SIZE + inset + x) * 4;
      if (background) {
        const alpha = source.pixels[sourceIndex + 3] / 255;
        const inverseAlpha = 1 - alpha;
        canvas[targetIndex] = Math.round(source.pixels[sourceIndex] * alpha + background[0] * inverseAlpha);
        canvas[targetIndex + 1] = Math.round(source.pixels[sourceIndex + 1] * alpha + background[1] * inverseAlpha);
        canvas[targetIndex + 2] = Math.round(source.pixels[sourceIndex + 2] * alpha + background[2] * inverseAlpha);
        canvas[targetIndex + 3] = 255;
      } else {
        source.pixels.copy(canvas, targetIndex, sourceIndex, sourceIndex + 4);
      }
    }
  }

  const rowBytes = ICON_SIZE * 4;
  const raw = Buffer.alloc(ICON_SIZE * (rowBytes + 1));
  for (let y = 0; y < ICON_SIZE; y += 1) {
    const rawRow = y * (rowBytes + 1);
    raw[rawRow] = 0;
    canvas.copy(raw, rawRow + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(ICON_SIZE, 0);
  header.writeUInt32BE(ICON_SIZE, 4);
  header[8] = 8;
  header[9] = 6;
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    pngSignature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

module.exports = ({ config }) => {
  const appDir = __dirname;
  const iconSource = path.resolve(appDir, "../web/src/app/icon.svg");
  const svg = fs.readFileSync(iconSource, "utf8");
  const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
  if (!match) throw new Error("Could not read the Charkhoone icon embedded in apps/web/src/app/icon.svg");

  const source = decodeRgbaPng(Buffer.from(match[1], "base64"));
  const adaptiveForeground = createPaddedIcon(source, null);
  const appIcon = createPaddedIcon(source, BRAND_BACKGROUND);
  const writeAsset = (relativePath, contents) => {
    const target = path.join(appDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  };

  // Leave room around the orange mark so Android masks and home-screen crops cannot clip it.
  writeAsset("assets/charkhoone-app-icon.png", appIcon);
  writeAsset("assets/charkhoone-adaptive-icon-foreground.png", adaptiveForeground);
  writeAsset("public/charkhoone-icon.png", appIcon);
  writeAsset("public/apple-touch-icon.png", appIcon);

  return config;
};
