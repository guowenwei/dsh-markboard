/**
 * Unit tests for where a fill lands.
 *
 * The routing rule is the whole point of `fillTarget`: a card from another
 * Session must reach the composer on screen instead of dragging the user into
 * the Session the mark came from.
 *
 * Run with `node --test tests/` on Node 22+ (native TypeScript type stripping;
 * the modules here are erasable-syntax-only on purpose).
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fillTarget, type Mark } from '../src/shared/marks.ts'

/** The only field routing reads. */
function mark(sessionId: string): Pick<Mark, 'sessionId'> {
  return { sessionId }
}

test('a mark from another Session fills the composer on screen', () => {
  assert.deepEqual(fillTarget(mark('s-mark'), 's-screen', 's-screen'), { sessionId: 's-screen', mode: 'append' })
})

test('a mark from the panel\'s own Session replaces that draft', () => {
  assert.deepEqual(fillTarget(mark('s1'), 's1', 's1'), { sessionId: 's1', mode: 'replace' })
})

test('the Session on screen is the fallback when the caller names none', () => {
  assert.deepEqual(fillTarget(mark('s-mark'), undefined, 's-screen'), { sessionId: 's-screen', mode: 'append' })
  assert.deepEqual(fillTarget(mark('s-mark'), '', 's-screen'), { sessionId: 's-screen', mode: 'append' })
})

test('the panel Session wins over the mark Session even before it is on screen', () => {
  assert.deepEqual(fillTarget(mark('s-mark'), 's-panel', undefined), { sessionId: 's-panel', mode: 'append' })
})

test('no Session at all leaves nothing to fill', () => {
  assert.equal(fillTarget(mark('s-mark'), undefined, undefined), undefined)
  assert.equal(fillTarget(mark('s-mark'), '', ''), undefined)
})
