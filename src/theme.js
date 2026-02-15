import { getColors } from "./colors.js";

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

function getScopes(tokenColorRule) {
  if (!tokenColorRule || !tokenColorRule.scope) {
    return [];
  }

  if (Array.isArray(tokenColorRule.scope)) {
    return tokenColorRule.scope;
  }

  return tokenColorRule.scope.split(",").map((scope) => scope.trim());
}

function applyTokenColorOverrides(tokenColors, tokenColorOverrides) {
  if (!Array.isArray(tokenColors) || !isPlainObject(tokenColorOverrides)) {
    return tokenColors;
  }

  return tokenColors.map((rule) => {
    const matchedScopes = getScopes(rule).filter((scope) => tokenColorOverrides[scope]);

    if (matchedScopes.length === 0) {
      return rule;
    }

    const nextRule = deepClone(rule);
    nextRule.settings = nextRule.settings || {};

    matchedScopes.forEach((scope) => {
      mergeObjects(nextRule.settings, tokenColorOverrides[scope]);
    });

    return nextRule;
  });
}

function getTheme({ theme, name, baseTheme }) {
  const variant = getColors(theme);
  const sourceTheme = baseTheme;

  if (!sourceTheme) {
    throw new Error(`Missing base theme for value: ${theme}`);
  }

  const nextTheme = deepClone(sourceTheme);
  nextTheme.name = name || variant.name || nextTheme.name;
  nextTheme.colors = deepClone(variant.colors || {});

  if (variant.semanticTokenColors) {
    nextTheme.semanticTokenColors = mergeObjects(
      nextTheme.semanticTokenColors || {},
      variant.semanticTokenColors
    );
  }

  if (variant.tokenColorOverrides) {
    nextTheme.tokenColors = applyTokenColorOverrides(
      nextTheme.tokenColors,
      variant.tokenColorOverrides
    );
  }

  return nextTheme;
}

export default getTheme;
