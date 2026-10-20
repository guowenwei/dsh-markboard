/**
 * Build the browser half into one `window.__ModuleLoader__.load` registration.
 *
 * DSH's client-module loader is a lazy CommonJS table: a plugin bundle calls
 * `load({ id, factory })` and resolves shared modules through the injected
 * `require`. This script produces exactly that envelope with esbuild, keeping
 * React and the shell's platform modules external so the page keeps one copy of
 * each.
 *
 * Run: `node scripts/build.mjs` (or `npm run build`).
 */

import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const outfile = resolve(root, 'lib/client.js')

/** Module-table specifiers the shell already owns; everything else is bundled in. */
const EXTERNAL = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

await mkdir(dirname(outfile), { recursive: true })

const result = await build({
  entryPoints: [resolve(root, 'src/client/index.ts')],
  outfile,
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: EXTERNAL,
  sourcemap: true,
  // A banner/footer pair turns the CJS output into one loader registration,
  // matching the shape `tsdown.client.ts` emits for first-party plugins.
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
  legalComments: 'none',
  logLevel: 'info',
})

const js = result.outputFiles.find(file => file.path.endsWith('.js'))
const map = result.outputFiles.find(file => file.path.endsWith('.js.map'))
if (js === undefined) {
  console.error('build: esbuild produced no JavaScript output')
  process.exit(1)
}
await writeFile(outfile, js.contents)
if (map !== undefined) await writeFile(`${outfile}.map`, map.contents)

const text = js.text
const problems = []
if (!text.startsWith('window.__ModuleLoader__.load(')) problems.push('bundle does not open the loader registration')
if (!text.includes(`id: ${JSON.stringify(manifest.name)}`)) problems.push('bundle id does not match the package name')
if (/require\("react"\)/.test(text) === false) problems.push('react was bundled instead of left external')
if (problems.length > 0) {
  console.error(`build: ${problems.join('; ')}`)
  process.exit(1)
}
console.log(`build: wrote ${outfile} (${js.contents.length} bytes)`)
