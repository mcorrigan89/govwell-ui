// Renders the registry's theme item (cssVars + css) as a stylesheet, so the
// preview is styled by exactly what `shadcn add @govwell/theme` installs.
// the radius scale shadcn init writes into a consumer's @theme
const RADII = [
  ['sm', 0.6],
  ['md', 0.8],
  ['lg', 1],
  ['xl', 1.4],
  ['2xl', 1.8],
  ['3xl', 2.2],
  ['4xl', 2.6],
]
  .map(([k, f]) => `  --radius-${k}: ${f === 1 ? 'var(--radius)' : `calc(var(--radius) * ${f})`};`)
  .join('\n');

export function themeCss(items) {
  // @import has to come before any other rule, so the items' imports go first
  const imports = items.flatMap((item) => Object.keys(item.css ?? {}).filter((k) => k.startsWith('@import')));
  const out = [imports.map((k) => `${k};`).join('\n')];
  const decls = (obj, indent) =>
    Object.entries(obj)
      .map(([k, v]) =>
        typeof v === 'object'
          ? Object.keys(v).length === 0
            ? `${indent}${k};`
            : `${indent}${k} {\n${decls(v, indent + '  ')}\n${indent}}`
          : `${indent}${k}: ${v};`,
      )
      .join('\n');
  for (const item of items) {
    const vars = item.cssVars ?? {};
    if (vars.theme)
      out.push(
        `@theme inline {\n${Object.entries(vars.theme)
          .map(([k, v]) => `  --${k}: ${v};`)
          .join('\n')}\n${Object.keys(vars.light ?? {})
          .filter((k) => k !== 'radius' && !(`color-${k}` in vars.theme))
          .map((k) => `  --color-${k}: var(--${k});`)
          .join('\n')}\n${RADII}\n}`,
      );
    if (vars.light)
      out.push(
        `:root {\n${Object.entries(vars.light)
          .map(([k, v]) => `  --${k}: ${v};`)
          .join('\n')}\n}`,
      );
    const css = Object.fromEntries(Object.entries(item.css ?? {}).filter(([k]) => !k.startsWith('@import')));
    out.push(decls(css, ''));
  }
  return out.join('\n\n') + '\n';
}
