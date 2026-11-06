// End-to-end check of the registry as a consumer meets it: build the registry
// for a local URL, serve it, scaffold a fresh Vite + Tailwind app, install
// every item with `shadcn add @govwell/...`, then type-check and build that
// app. Catches broken registryDependencies, missing npm deps, and imports
// that only resolve inside this repo. Works in .verify/ (gitignored).
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const PORT = Number(process.env.VERIFY_PORT ?? 5199);
const REGISTRY_URL = `http://localhost:${PORT}`;
const APP = '.verify/app';
// async, so the registry server below keeps answering while the CLI runs
const run = (cmd, args, cwd = '.', env = {}) =>
  new Promise((ok, fail) =>
    spawn(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } }).on('exit', (code) =>
      code === 0 ? ok() : fail(new Error(`${cmd} ${args.join(' ')} exited ${code}`)),
    ),
  );

await run('node', ['scripts/build-registry.mjs'], '.', { REGISTRY_URL });
const items = JSON.parse(readFileSync('registry.json', 'utf8')).items;

// serve public/ for the shadcn CLI
const server = createServer((req, res) => {
  const file = join('public', decodeURIComponent(new URL(req.url, REGISTRY_URL).pathname));
  if (!existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': 'application/json' });
  createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(PORT, ok));

try {
  rmSync(APP, { recursive: true, force: true });
  mkdirSync(`${APP}/src`, { recursive: true });
  const write = (path, body) => writeFileSync(join(APP, path), typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  write('package.json', {
    name: 'govwell-verify',
    private: true,
    type: 'module',
    scripts: { build: 'tsc --noEmit && vite build' },
    dependencies: { react: '^19', 'react-dom': '^19' },
    devDependencies: {
      '@tailwindcss/vite': '^4',
      '@types/node': '*',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      '@vitejs/plugin-react': '*',
      tailwindcss: '^4',
      typescript: '*',
      vite: '*',
    },
  });
  write('components.json', {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'base-vega',
    rsc: false,
    tsx: true,
    tailwind: { config: '', css: 'src/index.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
    aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
    iconLibrary: 'lucide',
    registries: { '@govwell': `${REGISTRY_URL}/r/{name}.json` },
  });
  write('tsconfig.json', {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      types: ['vite/client'],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
  });
  write(
    'vite.config.ts',
    `import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()], resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } } });
`,
  );
  write(
    'index.html',
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
  write('src/index.css', '@import "tailwindcss";\n');

  await run('pnpm', ['install', '--silent'], APP);
  await run('npx', ['shadcn@latest', 'add', ...items.map((i) => `@govwell/${i.name}`), '--yes', '--overwrite'], APP);

  // import every installed module so the build type-checks all of them
  const modules = items.flatMap((i) =>
    (i.files ?? [])
      .filter((f) => /\.tsx?$/.test(f.path))
      .map((f) =>
        // a file with a target is imported from where it was put
        f.target
          ? `@/${f.target.replace(/\.tsx?$/, '')}`
          : f.type === 'registry:ui'
            ? `@/components/ui/${f.path
                .split('/')
                .pop()
                .replace(/\.tsx?$/, '')}`
            : f.type === 'registry:hook'
              ? `@/hooks/${f.path
                  .split('/')
                  .pop()
                  .replace(/\.tsx?$/, '')}`
              : f.type === 'registry:lib'
                ? `@/lib/${f.path
                    .split('/')
                    .pop()
                    .replace(/\.tsx?$/, '')}`
                : `@/components/${f.path
                    .split('/')
                    .pop()
                    .replace(/\.tsx?$/, '')}`,
      ),
  );
  write(
    'src/main.tsx',
    `import './index.css';\n${modules.map((m, n) => `import * as m${n} from '${m}';`).join('\n')}\nconsole.log(${modules.map((_, n) => `m${n}`).join(', ')});\n`,
  );
  await run('pnpm', ['build'], APP);

  // the theme landed: tokens mapped to utilities, and the custom utilities exist
  const css = readFileSync(join(APP, 'src/index.css'), 'utf8');
  const missing = [
    '--color-primary: var(--primary)',
    '--color-hope',
    '@utility base-grid',
    '@utility eyebrow-type',
    ':root[data-mode="dark"]',
  ].filter((s) => !css.includes(s));
  if (missing.length) throw new Error(`index.css is missing: ${missing.join(', ')}`);
  console.log(`\n✓ verify: ${items.length} items installed, type-checked and built in ${APP}`);
} finally {
  server.close();
}
