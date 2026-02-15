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

const palette = readTokenFile("palette.json");

const RAW_VARIANT_DEFINITIONS = {
  dark: {
    name: "Valley of Bowser",
    colors: {},
  },
  dark_dimmed: readTokenFile("dark-dimmed.json"),
  dark_high_contrast: readTokenFile("dark-high-contrast.json"),
  dark_colorblind: readTokenFile("dark-colorblind.json"),
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
