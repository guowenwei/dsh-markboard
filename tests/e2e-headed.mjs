/**
 * Visible end-to-end check for dsh-markboard.
 *
 * This is the "watch it happen" run: a real headed Chromium opens on the
 * machine, drives the plugin, and writes a screenshot per stage. It is not part
 * of `npm test` (that suite is storage/model only); a release check runs this
 * against a disposable DSH home.
 *
 * Usage:
 *   node tests/e2e-headed.mjs --url "http://127.0.0.1:3099/?token=…"
 *
 * Options:
 *   --url <url>        Board URL as printed by `dsh web` (required)
 *   --out <dir>        Screenshot directory (default: docs/e2e)
 *   --slow <ms>        Pause between steps so a human can follow (default 700)
 *   --headless         Run without a window (CI); default is headed
 */

import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

/** Global Playwright install bundled with the DSH browser tooling. */
const GLOBAL_PLAYWRIGHT = 'C:/Users/guowen/AppData/Roaming/npm/node_modules/@playwright/mcp/node_modules/playwright-core'

/** Arguments as a flat flag map. */
const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? fallback : argv[index + 1]
}
const has = name => argv.includes(`--${name}`)

const url = arg('url', '')
if (url === '') {
  console.error('e2e: --url is required (the token URL printed by dsh web)')
  process.exit(2)
}
const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '..', arg('out', 'docs/e2e'))
const slow = Number(arg('slow', '700'))
await mkdir(outDir, { recursive: true })

const playwright = require(GLOBAL_PLAYWRIGHT)
const executablePath = process.env.MARKBOARD_CHROMIUM
  ?? 'C:/Users/guowen/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'

let step = 0
const failures = []

/** Screenshot one stage, named by order so the gallery reads top to bottom. */
async function shot(page, name) {
  step += 1
  const file = resolve(outDir, `${String(step).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  console.log(`   📸 ${file}`)
  await page.waitForTimeout(slow)
}

/** Assert with a message that names the stage, collecting instead of aborting the run. */
function check(condition, message) {
  if (condition) {
    console.log(`   ✓ ${message}`)
    return
  }
  console.log(`   ✗ ${message}`)
  failures.push(message)
}

const browser = await playwright.chromium.launch({
  headless: has('headless'),
  executablePath,
  args: ['--start-maximized'],
})

try {
  const context = await browser.newContext({ viewport: null, locale: 'zh-CN' })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)

  console.log('1. Boot the isolated DSH Web GUI')
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  // First-run dialogs (preview notice, sign-in prompt) are dismissed so the
  // transcript is reachable; neither belongs to this plugin. They can appear in
  // either order, so both are attempted a few times.
  const dismissFirstRun = async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      let clicked = false
      for (const name of ['继续', '关闭']) {
        const button = page.getByRole('button', { name, exact: true })
        if (await button.count() > 0 && await button.first().isVisible()) {
          await button.first().click()
          clicked = true
          await page.waitForTimeout(700)
        }
      }
      if (!clicked) return
    }
  }
  await dismissFirstRun()

  console.log('2. Open a session that already has history')
  const rows = page.locator('[role="treeitem"][data-row-key^="session:"]')
  const rowCount = await rows.count()
  let opened = false
  for (let index = 0; index < rowCount; index++) {
    const candidate = rows.nth(index)
    if ((await candidate.innerText()).includes('新会话')) continue
    await candidate.click()
    try {
      await page.waitForSelector('[data-chat-turn]', { timeout: 15_000 })
      opened = true
      break
    } catch {
      await dismissFirstRun()
    }
  }
  check(opened, `打开了一个带历史的会话（共 ${rowCount} 个会话行）`)
  await page.waitForTimeout(1200)
  await shot(page, 'session')

  const markButtons = page.locator('.mb-mark-action')
  const count = await markButtons.count()
  check(count > 0, `每轮操作行出现「标记」按钮（找到 ${count} 个）`)

  console.log('3. Mark one turn')
  const target = markButtons.last()
  await target.scrollIntoViewIfNeeded()
  await target.click()
  await page.waitForTimeout(800)
  await shot(page, 'marked')

  const marked = await target.getAttribute('data-marked')
  check(marked !== null, '被标记的轮次按钮切换为已标记态')
  const toast = page.locator('.mb-toast')
  check(await toast.count() > 0, '右下角出现「已标记」提示（含撤销）')

  const headerEntry = page.locator('[data-dsh-markboard-entry]')
  check(await headerEntry.count() > 0, '会话头部出现标记计数入口')

  console.log('4. Open the markboard panel')
  await headerEntry.first().click()
  await page.waitForSelector('[data-dsh-markboard-panel]', { timeout: 15_000 })
  await page.waitForTimeout(900)
  const cards = page.locator('[data-dsh-markboard-card]')
  const cardCount = await cards.count()
  check(cardCount === 1, `面板里出现 1 张卡片（实际 ${cardCount}）`)
  await shot(page, 'panel')

  console.log('5. Rename the card')
  await page.locator('.mb-card-label').first().click()
  await page.waitForTimeout(300)
  const rename = page.locator('.mb-rename')
  await rename.fill('文档上传校验顺序')
  await rename.press('Enter')
  await page.waitForTimeout(600)
  const renamed = await page.locator('.mb-card-label').first().textContent()
  check(renamed === '文档上传校验顺序', `卡片重命名生效（${renamed}）`)

  console.log('6. Fill the composer from the card')
  await page.getByRole('button', { name: '填入输入框' }).first().click()
  await page.waitForTimeout(1200)
  const editor = page.locator('[contenteditable="true"], textarea').first()
  const draft = await editor.innerText().catch(async () => editor.inputValue())
  check(draft.includes('标记 ·'), '草稿里出现引用抬头')
  check(draft.includes('文档上传校验顺序') || draft.includes('第'), '草稿包含来源轮次说明')
  await shot(page, 'filled')

  console.log('7. Jump from the card back to its turn')
  await page.getByRole('button', { name: '跳转' }).first().click()
  // The landing flash lasts ~1.4s, so it is sampled inside that window rather
  // than after the scroll settles.
  let flashed = 0
  for (let attempt = 0; attempt < 20; attempt++) {
    flashed = await page.locator('.mb-flash').count()
    if (flashed > 0) break
    await page.waitForTimeout(100)
  }
  check(flashed > 0, '目标轮次出现高亮闪烁')
  await page.waitForTimeout(600)
  const landed = await page.evaluate(() => {
    const row = document.querySelector('.mb-flash') ?? document.querySelector('[data-chat-turn]')
    if (row === null) return null
    const box = row.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, height: window.innerHeight }
  })
  check(landed !== null && landed.bottom > 0 && landed.top < landed.height, '目标轮次滚动进了可视区')
  await shot(page, 'jump')

  console.log('8. Reload: marks survive')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const afterReloadButton = await page.locator('.mb-mark-action').count()
  check(afterReloadButton > 0, '刷新后标记按钮仍在')
  check(await page.locator('[data-dsh-markboard-entry]').count() > 0, '刷新后头部计数仍在')
  const stored = await page.evaluate(() => localStorage.getItem('dsh-markboard.v1'))
  check(stored !== null && stored.includes('文档上传校验顺序'), 'localStorage 里保存了重命名后的卡片')
  await shot(page, 'reloaded')

  console.log('9. Search and all-sessions scope')
  await page.locator('[data-dsh-markboard-entry]').first().click()
  await page.waitForSelector('[data-dsh-markboard-panel]')
  await page.waitForTimeout(500)
  const search = page.locator('.mb-search input')
  await search.fill('不存在的关键词')
  await page.waitForTimeout(400)
  check(await page.locator('.mb-empty').count() > 0, '搜索无结果时显示空态文案')
  await search.fill('校验')
  await page.waitForTimeout(400)
  check(await page.locator('[data-dsh-markboard-card]').count() === 1, '搜索命中已重命名的卡片')
  await shot(page, 'search')

  console.log('10. Delete with undo')
  await page.getByRole('button', { name: '删除' }).first().click()
  await page.waitForTimeout(600)
  check(await page.locator('[data-dsh-markboard-card]').count() === 0, '删除后卡片消失')
  await page.locator('.mb-toast button').first().click()
  await page.waitForTimeout(600)
  check(await page.locator('[data-dsh-markboard-card]').count() === 1, '撤销后卡片恢复')
  await shot(page, 'undo')

  console.log('')
  if (failures.length > 0) {
    console.error(`e2e: ${failures.length} check(s) failed`)
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exitCode = 1
  } else {
    console.log('e2e: all checks passed')
  }
} finally {
  if (!has('keep-open')) await browser.close()
}
