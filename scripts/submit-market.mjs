/**
 * Open the two market submissions for dsh-markboard.
 *
 * Both markets are community repositories this project does not own, and both
 * gate on state that cannot be faked:
 *   - dshopen.org reads the npm registry and refuses an index whose package is
 *     not published, so `dsh-markboard` must exist on npm first.
 *   - awesome-dsh-plugin requires the repository to be at least one day old.
 *
 * This script checks those gates, prepares the one-file change each market
 * wants, validates it locally where the market ships a validator, and only then
 * forks + pushes + opens the PR with `gh`.
 *
 * Usage:
 *   node scripts/submit-market.mjs --check          # report gate status only
 *   node scripts/submit-market.mjs --market dshopen # submit one market
 *   node scripts/submit-market.mjs --market awesome
 *   node scripts/submit-market.mjs --market all
 *
 * Requires an authenticated `gh` (the same account that owns the plugin repo).
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OWNER = 'guowenwei'
const REPO = 'dsh-markboard'
const PACKAGE = 'dsh-markboard'
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
const TARBALL = `https://github.com/${OWNER}/${REPO}/releases/download/v${VERSION}/${PACKAGE}.tgz`

const argv = process.argv.slice(2)
const flag = name => argv.includes(`--${name}`)
const value = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? fallback : argv[index + 1]
}

/** Run a command and return its trimmed stdout. */
function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim()
}

/** Run a command without failing the script when it reports a non-zero exit. */
function attempt(command, args, options = {}) {
  try {
    return { ok: true, output: run(command, args, options) }
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() }
  }
}

/** Whether the exact version is readable from the public registry. */
function npmPublished() {
  const result = attempt('npm', ['view', `${PACKAGE}@${VERSION}`, 'version', '--registry', 'https://registry.npmjs.org'])
  return { ok: result.ok && result.output.includes(VERSION), detail: result.output.split('\n')[0] ?? '' }
}

/** Whether the plugin repository has reached the catalogue's one-day age floor. */
function repoAge() {
  const created = attempt('gh', ['api', `repos/${OWNER}/${REPO}`, '--jq', '.created_at'])
  if (!created.ok) return { ok: false, detail: created.output }
  const days = (Date.now() - Date.parse(created.output)) / 86_400_000
  return { ok: days >= 1, detail: `created ${created.output} (${days.toFixed(2)} days old)` }
}

/** Fresh clone of one market repository under a scratch directory. */
function clone(marketUrl, name) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-market-'))
  const dir = join(root, name)
  run('git', ['clone', '--depth', '1', marketUrl, dir])
  run('git', ['checkout', '-b', `add-${PACKAGE}`], { cwd: dir })
  return dir
}

/**
 * The wowies: index entry shape. Written with JSON.parse/stringify so the
 * surrounding 700-entry file keeps its formatting instead of being reflowed.
 */
function prepareDshopen() {
  const dir = clone('https://github.com/polang233/dsh-plugin-index.git', 'dsh-plugin-index')
  const file = join(dir, 'data', 'sources.json')
  const raw = readFileSync(file, 'utf8')
  const data = JSON.parse(raw)
  if (data.packages.some(entry => entry.name === PACKAGE)) return { dir, changed: false }
  data.packages.push({
    name: PACKAGE,
    title: { en: 'Conversation Marks', zh: '会话标记板' },
    description: {
      en: 'Mark any conversation turn as a named task card, jump back to it later, and quote its answer into the composer. Marks stay in this browser.',
      zh: '把任意一轮对话标记成任务卡：命名、跳回原处，并一键把结论填进输入框。标记保存在本机浏览器。',
    },
    category: 'interface',
  })
  writeFileSync(file, `${JSON.stringify(data, null, 2)}${raw.endsWith('\n') ? '\n' : ''}`, 'utf8')
  run('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], { cwd: dir })
  // The market's own gateway: it reads the npm registry and the repo metadata.
  run('node', ['scripts/validate.mjs'], { cwd: dir })
  return { dir, changed: true }
}

/** The curated list's one-file-per-plugin submission. */
function prepareAwesome() {
  const dir = clone('https://github.com/awesome-dsh-plugin/awesome-dsh-plugin.git', 'awesome-dsh-plugin')
  const file = join(dir, 'data', 'plugins', `${OWNER}__${REPO}.yml`)
  if (existsSync(file)) return { dir, changed: false }
  mkdirSync(join(dir, 'data', 'plugins'), { recursive: true })
  writeFileSync(file, [
    `url: https://github.com/${OWNER}/${REPO}`,
    `name: ${OWNER}/${REPO}`,
    'category: ui',
    `tarball: ${TARBALL}`,
    'description:',
    '  en: Mark conversation turns as named task cards, jump back to a turn, and quote its answer into the composer.',
    '  zh: 把任意一轮对话标记成任务卡，可跳回原处，并把结论一键填进输入框。',
    '',
  ].join('\n'), 'utf8')
  return { dir, changed: true }
}

/** Push the branch to a fork and open the PR against the market's default branch. */
function openPullRequest(dir, repository, title, body) {
  const fork = attempt('gh', ['repo', 'fork', repository, '--remote=false'])
  if (!fork.ok) console.log(`   fork: ${fork.output}`)
  const remote = `https://github.com/${OWNER}/${repository.split('/')[1]}.git`
  attempt('git', ['remote', 'add', 'fork', remote], { cwd: dir })
  run('git', ['push', 'fork', 'HEAD:refs/heads/add-dsh-markboard', '--force'], { cwd: dir })
  const pr = run('gh', [
    'pr', 'create', '--repo', repository,
    '--head', `${OWNER}:add-dsh-markboard`,
    '--title', title, '--body', body,
  ])
  return pr
}

const gateNpm = npmPublished()
const gateAge = repoAge()
console.log(`npm  ${PACKAGE}@${VERSION}: ${gateNpm.ok ? 'published' : 'NOT published'} — ${gateNpm.detail}`)
console.log(`repo ${OWNER}/${REPO}: ${gateAge.ok ? 'old enough' : 'too new'} — ${gateAge.detail}`)
if (flag('check')) process.exit(gateNpm.ok || gateAge.ok ? 0 : 0)

const market = value('market', '')
const body = [
  `Adds \`${PACKAGE}@${VERSION}\`: a conversation markboard for the DSH Web UI.`,
  '',
  '- Per-turn Mark action in the answer action row; marks are named task cards.',
  '- A right-Sidebar page with this-session / all-sessions scopes and search.',
  '- Jump back scrolls to the turn, paging history through the kernel `loadThrough(seq)`.',
  '- Fill composer quotes the answer as plain text; the previous draft is restorable.',
  '- Data stays in the browser (`localStorage`); no Host service, no network.',
  '',
  `Source: https://github.com/${OWNER}/${REPO}`,
  `Release: https://github.com/${OWNER}/${REPO}/releases/tag/v${VERSION}`,
].join('\n')

if (market === 'dshopen' || market === 'all') {
  if (!gateNpm.ok) {
    console.log('dshopen: skipped — the market builds its index from npm, so the package must be published first.')
  } else {
    console.log('dshopen: preparing …')
    const { dir, changed } = prepareDshopen()
    if (!changed) console.log('dshopen: entry already present, nothing to submit.')
    else console.log('dshopen: PR', openPullRequest(dir, 'polang233/dsh-plugin-index', `Add ${PACKAGE}`, body))
  }
}

if (market === 'awesome' || market === 'all') {
  if (!gateAge.ok) {
    console.log('awesome: skipped — the catalogue requires a repository at least one day old; rerun tomorrow.')
  } else {
    console.log('awesome: preparing …')
    const { dir, changed } = prepareAwesome()
    if (!changed) console.log('awesome: entry already present, nothing to submit.')
    else console.log('awesome: PR', openPullRequest(dir, 'awesome-dsh-plugin/awesome-dsh-plugin', `Add ${PACKAGE}`, body))
  }
}
