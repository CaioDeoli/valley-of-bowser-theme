import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import getTheme from "./theme.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT_DIR, "themes");
const BASE_DARK_THEME_PATH = path.join(__dirname, "base", "dark.json");

const THEMES_TO_BUILD = [
  {
    theme: "dark",
    name: "Valley of Bowser",
    outputPath: path.join(THEMES_DIR, "dark.json"),
  },
  {
    theme: "dark_high_contrast",
    name: "Valley of Bowser High Contrast",
    outputPath: path.join(THEMES_DIR, "dark-high-contrast.json"),
  },
  {
    theme: "dark_colorblind",
    name: "Valley of Bowser Colorblind",
    outputPath: path.join(THEMES_DIR, "dark-colorblind.json"),
  },
  {
    theme: "dark_dimmed",
    name: "Valley of Bowser Dimmed",
    outputPath: path.join(THEMES_DIR, "dark-dimmed.json"),
  },
];

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeBaseTheme(baseTheme) {
  const cleanBase = deepClone(baseTheme);
  cleanBase.colors = {};
  return cleanBase;
}

async function main() {
  await fs.mkdir(THEMES_DIR, { recursive: true });

  const rawBaseTheme = await readJson(BASE_DARK_THEME_PATH);
  const baseTheme = sanitizeBaseTheme(rawBaseTheme);

  await Promise.all(
    THEMES_TO_BUILD.map(async ({ theme, name, outputPath }) => {
      const generatedTheme = getTheme({
        theme,
        name,
        baseTheme,
      });

      await fs.writeFile(`${outputPath}`, `${JSON.stringify(generatedTheme, null, 2)}\n`);
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
