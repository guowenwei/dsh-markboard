/**
 * Markboard data model: pure functions over one persisted mark list.
 *
 * Nothing here touches the DOM, React, or the Host. The browser half owns
 * localStorage and calls these functions; tests import the same module
 * directly, so persistence rules are verified without a browser.
 *
 * A mark addresses one Turn of one Session. `sessionId` + `turn` is the
 * identity that makes marking idempotent: marking the same Turn twice edits
 * the existing card instead of adding a second one.
 */

/** Persisted storage key. Version bump is a breaking format change, never a silent migration. */
export const STORAGE_KEY = 'dsh-markboard.v1'

/** Bounds applied before persisting; they keep one mark's JSON small enough for a quota-limited store. */
export const LIMITS = {
  /** Characters of the user's prompt retained for the card preview. */
  prompt: 400,
  /** Characters of the Turn's answer retained for the card preview and the composer fill. */
  response: 2400,
  /** Characters of the user-editable task label. */
  label: 60,
  /** Total marks retained; oldest marks beyond this are dropped on write. */
  marks: 500,
} as const

/** One marked Turn. */
export interface Mark {
  /** Stable identity from the browser's UUID source. */
  readonly id: string
  /** Session the Turn belongs to. */
  readonly sessionId: string
  /** Session title captured when the mark was made; a later rename does not rewrite history. */
  readonly sessionTitle: string
  /** Turn number as the conversation numbers it (0-based). */
  readonly turn: number
  /** The Turn's closing sequence, used to page history in before jumping. */
  readonly seq: number
  /** Bounded copy of the user's prompt. */
  readonly prompt: string
  /** Bounded copy of the Turn's answer. */
  readonly response: string
  /** User-facing task name; defaults to the prompt's first sentence. */
  readonly label: string
  /** Creation time in epoch milliseconds. */
  readonly createdAt: number
}

/** Everything needed to create or replace one mark, before normalization. */
export interface MarkInput {
  readonly sessionId: string
  readonly sessionTitle: string
  readonly turn: number
  readonly seq: number
  readonly prompt: string
  readonly response: string
  readonly label?: string
  readonly createdAt?: number
}

/** Collapse whitespace so previews and labels stay one visual line. */
export function collapse(text: string): string {
  return text.replace(/\s+/gu, ' ').trim()
}

/** Clip to `max` characters, marking the cut with an ellipsis. */
export function clip(text: string, max: number): string {
  const collapsed = collapse(text)
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, Math.max(0, max - 1))}…`
}

/** Derive a default task name from the prompt: its first sentence, or a bounded prefix. */
export function defaultLabel(prompt: string): string {
  const collapsed = collapse(prompt)
  if (collapsed === '') return ''
  const sentence = /^(.+?[。！？!?.;；])/u.exec(collapsed)?.[1] ?? collapsed
  return clip(sentence, LIMITS.label)
}

/** Whether two marks address the same Turn. */
export function sameTarget(left: Pick<Mark, 'sessionId' | 'turn'>, right: Pick<Mark, 'sessionId' | 'turn'>): boolean {
  return left.sessionId === right.sessionId && left.turn === right.turn
}

/**
 * Normalize one input into a storable mark.
 * @param input - captured Turn facts and any user-chosen label.
 * @param id - identity to use; the caller supplies a fresh UUID for new marks.
 * @returns the bounded mark.
 */
export function normalize(input: MarkInput, id: string): Mark {
  const prompt = clip(input.prompt, LIMITS.prompt)
  return {
    id,
    sessionId: input.sessionId,
    sessionTitle: clip(input.sessionTitle, 120),
    turn: input.turn,
    seq: input.seq,
    prompt,
    response: clip(input.response, LIMITS.response),
    label: clip(input.label ?? defaultLabel(prompt), LIMITS.label),
    createdAt: input.createdAt ?? Date.now(),
  }
}

/**
 * Add a mark, replacing any existing mark for the same Turn.
 * The replacement keeps the existing identity and creation time.
 * @param marks - current list, newest first.
 * @param mark - normalized mark to place.
 * @returns the next list and the effective mark.
 */
export function put(marks: readonly Mark[], mark: Mark): { marks: Mark[]; mark: Mark } {
  const existing = marks.findIndex(candidate => sameTarget(candidate, mark))
  const without = existing === -1 ? [...marks] : [...marks.slice(0, existing), ...marks.slice(existing + 1)]
  const previous = existing === -1 ? undefined : marks[existing]
  const effective = previous === undefined ? mark : { ...mark, id: previous.id, createdAt: previous.createdAt }
  const next = [effective, ...without].slice(0, LIMITS.marks)
  return { marks: next, mark: effective }
}

/** Remove one mark by identity. */
export function remove(marks: readonly Mark[], id: string): Mark[] {
  return marks.filter(mark => mark.id !== id)
}

/** Replace one mark's task name, bounded like a new mark's. */
export function rename(marks: readonly Mark[], id: string, label: string): Mark[] {
  const next = clip(label, LIMITS.label)
  return marks.map(mark => mark.id === id ? { ...mark, label: next === '' ? defaultLabel(mark.prompt) : next } : mark)
}

/** Marks for one Session, newest first. */
export function forSession(marks: readonly Mark[], sessionId: string | undefined): Mark[] {
  return sessionId === undefined ? [] : marks.filter(mark => mark.sessionId === sessionId)
}

/** Whether a mark matches one free-text query across label, prompt, response, title, and Turn number. */
export function matches(mark: Mark, query: string): boolean {
  const needle = collapse(query).toLowerCase()
  if (needle === '') return true
  const haystack = [mark.label, mark.prompt, mark.response, mark.sessionTitle, String(mark.turn)]
    .join('\n')
    .toLowerCase()
  return haystack.includes(needle)
}

/** Filter by the active scope and query. `all` keeps every Session. */
export function select(marks: readonly Mark[], scope: 'session' | 'all', sessionId: string | undefined, query: string): Mark[] {
  const scoped = scope === 'all' ? [...marks] : forSession(marks, sessionId)
  return query === '' ? scoped : scoped.filter(mark => matches(mark, query))
}

/**
 * Build the composer text for one mark.
 * @param mark - the marked Turn.
 * @param turnLabel - localized Turn caption, e.g. `第 3 轮`.
 * @returns a plain-text quote ending in a blank line.
 */
export function draftText(mark: Mark, turnLabel: string): string {
  const title = mark.sessionTitle === '' ? mark.sessionId : mark.sessionTitle
  const body = collapse(mark.response === '' ? mark.prompt : mark.response)
  return `> 标记 · ${title} · ${turnLabel}\n> ${body}\n\n`
}

/** Where one fill lands. */
export interface FillTarget {
  /** Session owning the composer that receives the quote. */
  readonly sessionId: string
  /**
   * `replace` when the quote returns to its own Turn's Session, `append` when it
   * is carried into another one, where text already typed must survive.
   */
  readonly mode: 'replace' | 'append'
}

/**
 * Decide which composer a mark's fill goes to.
 *
 * The composer on screen wins over the mark's own Session: quoting a card from
 * another conversation must not navigate away from the one being typed in.
 * @param mark - the mark being filled.
 * @param into - Session owning the composer the caller wants, if it knows it.
 * @param mounted - Session currently on screen.
 * @returns the target, or `undefined` when no Session can take the text.
 */
export function fillTarget(
  mark: Pick<Mark, 'sessionId'>,
  into: string | undefined,
  mounted: string | undefined,
): FillTarget | undefined {
  const sessionId = into !== undefined && into !== '' ? into : mounted ?? ''
  if (sessionId === '') return undefined
  return { sessionId, mode: sessionId === mark.sessionId ? 'replace' : 'append' }
}

/**
 * Parse a persisted payload.
 * Unknown or malformed rows are dropped rather than repaired: a partial mark
 * cannot be jumped to, and keeping it would make the list lie.
 * @param raw - parsed JSON value, or `undefined` when nothing was stored.
 * @returns the surviving marks, newest first.
 */
export function parse(raw: unknown): Mark[] {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.marks)) return []
  const marks: Mark[] = []
  for (const entry of raw.marks) {
    if (!isRecord(entry)) continue
    const { id, sessionId, sessionTitle, turn, seq, prompt, response, label, createdAt } = entry
    if (typeof id !== 'string' || id === '') continue
    if (typeof sessionId !== 'string' || sessionId === '') continue
    if (!isInteger(turn) || !isInteger(seq) || !isInteger(createdAt)) continue
    if (typeof prompt !== 'string' || typeof response !== 'string') continue
    marks.push({
      id,
      sessionId,
      sessionTitle: typeof sessionTitle === 'string' ? sessionTitle : '',
      turn,
      seq,
      prompt,
      response,
      label: typeof label === 'string' && label !== '' ? label : defaultLabel(prompt),
      createdAt,
    })
  }
  return marks.sort((left, right) => right.createdAt - left.createdAt).slice(0, LIMITS.marks)
}

/** Serialize the list for storage. */
export function serialize(marks: readonly Mark[]): string {
  return JSON.stringify({ version: 1, marks })
}

/** Narrow unknown JSON to a record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Safe-integer guard shared by the numeric fields. */
function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
