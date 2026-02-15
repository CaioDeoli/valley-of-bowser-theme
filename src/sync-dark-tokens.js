import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_THEME_PATH = path.join(__dirname, "base", "dark.json");
const PALETTE_PATH = path.join(__dirname, "tokens", "palette.json");
const OUTPUT_PATH = path.join(__dirname, "tokens", "dark.json");

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenPaletteTokens(value, tokenPath, mapping) {
  if (typeof value === "string") {
    const normalizedColor = value.toLowerCase();
    if (!mapping[normalizedColor]) {
      mapping[normalizedColor] = `{${tokenPath}}`;
    }
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    flattenPaletteTokens(child, `${tokenPath}.${key}`, mapping);
  });
}

function mapColorValue(value, paletteTokenMap) {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedColor = value.toLowerCase();
  return paletteTokenMap[normalizedColor] || normalizedColor;
}

async function main() {
  const baseRaw = await fs.readFile(BASE_THEME_PATH, "utf8");
  const paletteRaw = await fs.readFile(PALETTE_PATH, "utf8");

  const baseTheme = JSON.parse(baseRaw);
  const palette = JSON.parse(paletteRaw);
  const baseColors = baseTheme.colors || {};

  const paletteTokenMap = {};
  flattenPaletteTokens(palette, "palette", paletteTokenMap);

  const tokenizedColors = {};
  Object.entries(baseColors).forEach(([key, value]) => {
    tokenizedColors[key] = mapColorValue(value, paletteTokenMap);
  });

  const output = {
    name: "Valley of Bowser",
    colors: tokenizedColors,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
