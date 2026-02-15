## Valley Theme Tokens

This folder centralizes color tokens so repeated hex values are easier to edit.
`src/base/dark.json` is treated as structure-only during build (`colors` are ignored).

### Files

- `palette.json`: shared color palette used by all variants.
- `dark.json`: full dark theme color source.
- `dark-*.json`: variant overrides consumed by `src/colors.js`.

### Token references

Use `{palette.some.path}` inside variant files:

```json
{
  "button.background": "{palette.brand.blueMuted}"
}
```

During build, `src/colors.js` resolves these references into hex values.

Variants inherit from `dark.json`, so only differences need to live in:
- `dark-dimmed.json`
- `dark-high-contrast.json`
- `dark-colorblind.json`

### Optional extraction

Run `npm run tokens:extract` to generate `src/tmp/*.json` reports with repeated colors from current theme outputs.

Run `npm run tokens:sync-dark` after changing `src/base/dark.json` to refresh `src/tokens/dark.json`.
