/**
 * Unit tests for the markboard's data model and persistence rules.
 *
 * Run with `node --test tests/` on Node 22+ (native TypeScript type stripping;
 * the modules here are erasable-syntax-only on purpose).
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  collapse, clip, defaultLabel, draftText, forSession, LIMITS, matches, normalize, parse,
  put, remove, rename, sameTarget, select, serialize, type Mark,
} from '../src/shared/marks.ts'

/** One normalized mark for tests that do not care about capture details. */
function sample(overrides: Partial<Parameters<typeof normalize>[0]> = {}, id = 'a'): Mark {
  return normalize({
    sessionId: 's1',
    sessionTitle: 'eTMF 文档模块重构',
    turn: 2,
    seq: 42,
    prompt: '那就按方案 B 落地，注意不要动已经执行过的 Liquibase changeset。',
    response: '已按方案 B 拆成三步。',
    createdAt: 1_700_000_000_000,
    ...overrides,
  }, id)
}

test('collapse folds every whitespace run into one space', () => {
  assert.equal(collapse('  a\n\n b\tc  '), 'a b c')
})

test('clip keeps short text and ellipsizes long text at the bound', () => {
  assert.equal(clip('abcdef', 6), 'abcdef')
  assert.equal(clip('abcdefg', 6), 'abcde…')
  assert.equal(clip('a'.repeat(10), 1), '…')
})

test('defaultLabel takes the first sentence and bounds it', () => {
  assert.equal(defaultLabel('先把上传顺序理清楚。再改代码。'), '先把上传顺序理清楚。')
  assert.equal(defaultLabel('no terminator here'), 'no terminator here')
  assert.equal(defaultLabel('   '), '')
  assert.ok(defaultLabel('长'.repeat(200)).length <= LIMITS.label)
})

test('normalize bounds every persisted field', () => {
  const mark = normalize({
    sessionId: 's1',
    sessionTitle: 'T'.repeat(400),
    turn: 1,
    seq: 2,
    prompt: 'p'.repeat(2000),
    response: 'r'.repeat(9000),
  }, 'id-1')
  assert.ok(mark.sessionTitle.length <= 120)
  assert.ok(mark.prompt.length <= LIMITS.prompt)
  assert.ok(mark.response.length <= LIMITS.response)
  assert.ok(mark.label.length <= LIMITS.label)
})

test('put is idempotent per Session and Turn and keeps the original identity', () => {
  const first = sample({ turn: 1 }, 'a')
  let marks: Mark[] = []
  const one = put(marks, first)
  marks = one.marks
  const second = sample({ turn: 1, response: 'updated' }, 'b')
  const two = put(marks, second)
  assert.equal(two.marks.length, 1)
  assert.equal(two.mark.id, 'a', 'the turn keeps its first identity')
  assert.equal(two.mark.createdAt, first.createdAt, 'creation time is not rewritten')
  assert.equal(two.marks[0]!.response, 'updated', 'the new content wins')
})

test('put keeps the newest mark first and bounds the list', () => {
  let marks: Mark[] = []
  for (let turn = 0; turn < LIMITS.marks + 3; turn++) {
    marks = put(marks, sample({ turn, createdAt: 1_700_000_000_000 + turn }, `id-${turn}`)).marks
  }
  assert.equal(marks.length, LIMITS.marks)
  assert.equal(marks[0]!.turn, LIMITS.marks + 2)
})

test('remove and rename address one mark by identity', () => {
  const a = sample({ turn: 1 }, 'a')
  const b = sample({ turn: 2 }, 'b')
  const marks = [b, a]
  assert.deepEqual(remove(marks, 'a').map(mark => mark.id), ['b'])
  assert.equal(rename(marks, 'b', '  新名字  ')[0]!.label, '新名字')
  assert.equal(rename(marks, 'b', '   ')[0]!.label, defaultLabel(b.prompt), 'an empty rename restores the derived name')
})

test('forSession, matches, and select pick the right rows', () => {
  const a = sample({ turn: 1, sessionId: 's1' }, 'a')
  const b = sample({ turn: 7, sessionId: 's2', prompt: 'Liquibase 校验和', response: 'checksum' }, 'b')
  const marks = [b, a]
  assert.deepEqual(forSession(marks, 's2').map(mark => mark.id), ['b'])
  assert.deepEqual(forSession(marks, undefined), [])
  assert.ok(matches(b, 'checksum'))
  assert.ok(matches(b, 'LIQUIBASE'), 'matching ignores case')
  assert.ok(matches(b, '7'), 'the turn number is searchable')
  assert.ok(matches(b, '  '), 'a blank query matches everything')
  assert.deepEqual(select(marks, 'session', 's1', '').map(mark => mark.id), ['a'])
  assert.deepEqual(select(marks, 'all', 's1', 'checksum').map(mark => mark.id), ['b'])
})

test('draftText quotes the answer with its source heading', () => {
  const mark = sample({ turn: 3 }, 'a')
  const text = draftText(mark, '第 3 轮')
  assert.ok(text.startsWith('> 标记 · eTMF 文档模块重构 · 第 3 轮\n> '))
  assert.ok(text.endsWith('\n\n'))
  assert.equal(text.split('\n').filter(line => line.startsWith('> ')).length, 2)
})

test('draftText falls back to the prompt when the answer is empty', () => {
  const mark = normalize({
    sessionId: 's1', sessionTitle: '', turn: 0, seq: 0, prompt: '只有提问', response: '',
  }, 'a')
  assert.ok(draftText(mark, '第 0 轮').includes('只有提问'))
  assert.ok(draftText(mark, '第 0 轮').includes('s1'), 'an untitled session falls back to its id')
})

test('serialize and parse round-trip', () => {
  const marks = [sample({ turn: 2 }, 'b'), sample({ turn: 1 }, 'a')]
  assert.deepEqual(parse(JSON.parse(serialize(marks))), marks)
})

test('parse drops malformed rows instead of repairing them', () => {
  const good = sample({}, 'ok')
  const payload = {
    version: 1,
    marks: [
      good,
      { ...good, id: '' },
      { ...good, id: 'x', sessionId: '' },
      { ...good, id: 'y', turn: -1 },
      { ...good, id: 'z', seq: 1.5 },
      { ...good, id: 'w', createdAt: 'now' },
      { ...good, id: 'v', prompt: 42 },
      null,
      'nope',
    ],
  }
  assert.deepEqual(parse(payload).map(mark => mark.id), ['ok'])
})

test('parse rejects an unknown version and a non-object payload', () => {
  assert.deepEqual(parse({ version: 2, marks: [] }), [])
  assert.deepEqual(parse(undefined), [])
  assert.deepEqual(parse('{"version":1,"marks":[]}'), [])
})

test('parse restores a missing label from the prompt', () => {
  const mark = sample({}, 'a')
  const payload = { version: 1, marks: [{ ...mark, label: '' }] }
  assert.equal(parse(payload)[0]!.label, defaultLabel(mark.prompt))
})

test('sameTarget compares Session and Turn only', () => {
  assert.ok(sameTarget(sample({ turn: 1 }, 'a'), { sessionId: 's1', turn: 1 }))
  assert.ok(!sameTarget(sample({ turn: 1 }, 'a'), { sessionId: 's1', turn: 2 }))
  assert.ok(!sameTarget(sample({ turn: 1 }, 'a'), { sessionId: 's2', turn: 1 }))
})
