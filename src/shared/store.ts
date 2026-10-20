/**
 * Markboard persistence: one localStorage key, mutate-persist-publish per write.
 *
 * The store is deliberately dumb. It owns the current array, notifies
 * subscribers, and reports a storage failure instead of throwing: a quota or
 * privacy-mode failure must leave the in-memory board usable, exactly like the
 * shell's own persisted stores.
 */

import {
  STORAGE_KEY, normalize, parse, put, remove, rename, serialize,
  type Mark, type MarkInput,
} from './marks.ts'

/** Outcome of one mutation. */
export type WriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'storage' }

/** Subscriber signature. */
export type Listener = () => void

/** Read the persisted list, tolerating a missing, corrupt, or unavailable store. */
export function read(): Mark[] {
  const storage = safeStorage()
  if (storage === undefined) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw === null ? [] : parse(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

/** The browser's localStorage, or undefined where the platform withholds it. */
function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** Write the list; failures are reported, never thrown. */
function write(storage: Storage, marks: readonly Mark[]): boolean {
  try {
    storage.setItem(STORAGE_KEY, serialize(marks))
    return true
  } catch {
    return false
  }
}

/** The live board: current marks, subscriber fan-out, and mutations that persist first. */
export interface Markboard {
  /** @returns the current marks, newest first. */
  getSnapshot(): readonly Mark[]
  /** @param listener - notified after every accepted mutation. @returns the unsubscribe function. */
  subscribe(listener: Listener): () => void
  /**
   * Add or replace the mark for one Turn.
   * @param input - captured Turn facts.
   * @param id - identity to use when nothing is marked yet.
   * @returns the effective mark, or a storage failure.
   */
  mark(input: MarkInput, id: string): { readonly ok: true; readonly mark: Mark } | { readonly ok: false; readonly reason: 'storage' }
  /** @param id - mark to remove. @returns whether removal persisted. */
  unmark(id: string): WriteResult
  /** @param id - mark to rename. @param label - replacement task name. @returns whether the rename persisted. */
  relabel(id: string, label: string): WriteResult
  /** @param marks - list to persist wholesale (undo of a removal). @returns whether it persisted. */
  restore(marks: readonly Mark[]): WriteResult
  /** Reload from storage, for a same-origin write from another tab. */
  refresh(): void
}

/**
 * Create the board over the platform storage.
 * @param idFactory - source of new mark identities; injected so tests stay deterministic.
 * @returns the live board.
 */
export function createMarkboard(idFactory: () => string): Markboard {
  let marks: Mark[] = read()
  const listeners = new Set<Listener>()

  const notify = (): void => {
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[dsh-markboard] subscriber failed:', error)
      }
    }
  }

  const publish = (next: Mark[]): WriteResult => {
    const storage = safeStorage()
    if (storage === undefined) {
      // No persistence available: keep the live list so the session is not broken.
      marks = next
      notify()
      return { ok: false, reason: 'storage' }
    }
    if (!write(storage, next)) return { ok: false, reason: 'storage' }
    marks = next
    notify()
    return { ok: true }
  }

  return {
    getSnapshot: () => marks,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mark(input, id) {
      const { marks: next, mark } = put(marks, normalize(input, id))
      const result = publish(next)
      return result.ok ? { ok: true, mark } : { ok: false, reason: 'storage' }
    },
    unmark: id => publish(remove(marks, id)),
    relabel: (id, label) => publish(rename(marks, id, label)),
    restore: next => publish([...next]),
    refresh() {
      marks = read()
      notify()
    },
  }
}
