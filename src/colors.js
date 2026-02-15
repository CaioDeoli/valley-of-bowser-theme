import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_DIR = path.join(__dirname, "tokens");

function readTokenFile(fileName) {
  const content = readFileSync(path.join(TOKENS_DIR, fileName), "utf8");
  return JSON.parse(content);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeObjects(target, source) {
  if (!isPlainObject(source)) {
    return target;
  }

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      mergeObjects(targetValue, sourceValue);
      return;
    }

    target[key] = deepClone(sourceValue);
  });

  return target;
}

function getByPath(source, dottedPath) {
  return dottedPath.split(".").reduce((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return current[segment];
  }, source);
}

function resolveReference(value, root) {
  if (typeof value !== "string") {
    return value;
  }

  const match = value.match(/^\{([^{}]+)\}$/);

  if (!match) {
    return value;
  }

  const resolved = getByPath(root, match[1]);

  if (resolved === undefined) {
    throw new Error(`Token reference not found: ${value}`);
  }

  return resolveTokenRefs(resolved, root);
}

function resolveTokenRefs(value, root) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveTokenRefs(item, root));
  }

  if (isPlainObject(value)) {
    const resolvedObject = {};

    Object.entries(value).forEach(([key, itemValue]) => {
      resolvedObject[key] = resolveTokenRefs(itemValue, root);
    });

    return resolvedObject;
  }

  return resolveReference(value, root);
}

function createVariant(baseVariant, overrides, fallbackName) {
  const merged = deepClone(baseVariant);
  const safeOverrides = overrides || {};

  merged.name = safeOverrides.name || fallbackName || merged.name;
  merged.colors = {
    ...(baseVariant.colors || {}),
    ...(safeOverrides.colors || {}),
  };

  if (safeOverrides.semanticTokenColors) {
    merged.semanticTokenColors = mergeObjects(
      merged.semanticTokenColors || {},
      safeOverrides.semanticTokenColors
    );
  }

  if (safeOverrides.tokenColorOverrides) {
    merged.tokenColorOverrides = mergeObjects(
      merged.tokenColorOverrides || {},
      safeOverrides.tokenColorOverrides
    );
  }

  return merged;
}

const palette = readTokenFile("palette.json");
const darkBaseVariant = readTokenFile("dark.json");
const darkDimmedOverrides = readTokenFile("dark-dimmed.json");
const darkHighContrastOverrides = readTokenFile("dark-high-contrast.json");
const darkColorblindOverrides = readTokenFile("dark-colorblind.json");

const RAW_VARIANT_DEFINITIONS = {
  dark: darkBaseVariant,
  dark_dimmed: createVariant(
    darkBaseVariant,
    darkDimmedOverrides,
    "Valley of Bowser Dimmed"
  ),
  dark_high_contrast: createVariant(
    darkBaseVariant,
    darkHighContrastOverrides,
    "Valley of Bowser High Contrast"
  ),
  dark_colorblind: createVariant(
    darkBaseVariant,
    darkColorblindOverrides,
    "Valley of Bowser Colorblind"
  ),
};

const VARIANT_DEFINITIONS = resolveTokenRefs(RAW_VARIANT_DEFINITIONS, {
  palette,
});

function getColors(theme) {
  const variant = VARIANT_DEFINITIONS[theme];

  if (!variant) {
    throw new Error(`Colors are missing for value: ${theme}`);
  }

  return deepClone(variant);
}

export { getColors };
