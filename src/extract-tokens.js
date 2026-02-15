import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT_DIR, "themes");
const TMP_DIR = path.join(__dirname, "tmp");

const MIN_REPETITIONS = 4;

const SOURCES = [
  { id: "dark", fileName: "dark.json" },
  { id: "dark.dimmed", fileName: "dark-dimmed.json" },
  { id: "dark.high-contrast", fileName: "dark-high-contrast.json" },
  { id: "dark.colorblind", fileName: "dark-colorblind.json" },
];

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value.trim());
}

function toTokenName(index) {
  return `color${String(index).padStart(3, "0")}`;
}

function collectCounts(colors) {
  const counts = new Map();

  Object.values(colors).forEach((value) => {
    if (!isHexColor(value)) {
      return;
    }

    const key = value.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
}

function buildExtract(themeJson, sourceId) {
  const colors = themeJson.colors || {};
  const counts = collectCounts(colors);

  const repeatedEntries = [...counts.entries()]
    .filter(([, count]) => count >= MIN_REPETITIONS)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const tokens = {};
  const colorToTokenRef = {};

  repeatedEntries.forEach(([hex], index) => {
    const tokenName = toTokenName(index + 1);
    tokens[tokenName] = hex;
    colorToTokenRef[hex] = `{tokens.${tokenName}}`;
  });

  const colorAssignments = {};
  Object.entries(colors).forEach(([key, value]) => {
    if (!isHexColor(value)) {
      colorAssignments[key] = value;
      return;
    }

    const tokenRef = colorToTokenRef[value.toLowerCase()];
    colorAssignments[key] = tokenRef || value.toLowerCase();
  });

  return {
    sourceTheme: sourceId,
    generatedAt: new Date().toISOString(),
    minRepetitions: MIN_REPETITIONS,
    repeatedColorCount: repeatedEntries.length,
    tokens,
    colors: colorAssignments,
  };
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });

  await Promise.all(
    SOURCES.map(async ({ id, fileName }) => {
      const sourcePath = path.join(THEMES_DIR, fileName);
      const outputPath = path.join(TMP_DIR, `${id}.json`);
      const raw = await fs.readFile(sourcePath, "utf8");
      const parsed = JSON.parse(raw);
      const extracted = buildExtract(parsed, id);
      await fs.writeFile(outputPath, `${JSON.stringify(extracted, null, 2)}\n`);
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
