/**
 * The markboard's behaviour face: everything the three UI seats share.
 *
 * This is the only file that talks to Cordis services. Components receive it
 * through `inject` and render; they never reach for `ctx`.
 *
 * @module dsh-markboard/client/surface
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId, SessionSeq } from '@deepseek-ai/dsh-session/types'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { SessionBinding } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { DraftInitializationOptions, DraftInitializationResult } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { TAB_KIND } from './kind.ts'
import type { Mark } from '../shared/marks.ts'
import { defaultLabel, draftText, fillTarget } from '../shared/marks.ts'
import type { Markboard } from '../shared/store.ts'

/** The subset of the Chat node store the mark action reads. */
export interface TurnSource {
  /**
   * One Turn's nodes of one kind, in anchor order.
   * @param turn - Turn number.
   * @param kind - Chat node kind.
   */
  turnDataSource(turn: number, kind: 'user' | 'assistant-step'): ObservableSnapshot<readonly unknown[]>
}

/** Facts one Turn contributes when the user marks it. */
export interface TurnFacts {
  readonly sessionId: string
  readonly sessionTitle: string
  readonly turn: number
  readonly seq: number
  readonly prompt: string
  readonly response: string
}

/** A transient notice; `id` keys repeats so the same notice can be announced twice. */
export interface Toast {
  readonly id: number
  readonly text: string
  readonly action?: { readonly label: string; readonly run: () => void }
}

/** One localized translator. */
export type Translate = (key: string, params?: Readonly<Record<string, string | number>>) => string

/** What the seats read and call. */
export interface MarkboardSurface {
  /** Live mark list, newest first. */
  readonly marks: ObservableSnapshot<readonly Mark[]>
  /** Live notice, or `undefined` when nothing is showing. */
  readonly toast: ObservableSnapshot<Toast | undefined>
  /** Live key label of the open shortcut, e.g. `Ctrl+Alt+M`; empty when unbound. */
  readonly shortcut: ObservableSnapshot<string>
  /**
   * Capture one Turn from its Session's node store.
   * @param source - the Turn's Chat node store.
   * @param turn - Turn number.
   * @param seq - the Turn's closing sequence.
   * @param sessionId - owning Session.
   * @returns captured facts, with empty strings where the window has no text.
   */
  capture(source: TurnSource, turn: number, seq: number, sessionId: string): TurnFacts
  /** @param sessionId - Session to inspect. @returns its title as the Host list reports it, or `''`. */
  titleOf(sessionId: string): string
  /** @param sessionId - Session to inspect. @param turn - Turn to inspect. @returns the mark addressing it. */
  markFor(sessionId: string, turn: number): Mark | undefined
  /**
   * Persist one Turn as a mark, replacing any existing mark for the same Turn.
   * @param facts - captured Turn facts.
   * @param label - user-chosen task name; omitted derives one from the prompt.
   * @returns whether it persisted; a storage failure is announced, not thrown.
   */
  mark(facts: TurnFacts, label?: string): boolean
  /** @param id - mark to remove. */
  unmark(id: string): void
  /** @param id - mark to rename. @param label - replacement task name. */
  relabel(id: string, label: string): void
  /** @param id - mark to delete, announced with an undo. */
  remove(id: string): void
  /**
   * Open the mark's Session and scroll its Turn into view, paging history in
   * when the Turn is outside the loaded window.
   * @param mark - the mark to reveal.
   */
  jump(mark: Mark): void
  /**
   * Put the mark's answer into a composer as a plain-text quote.
   * @param mark - the mark to quote.
   * @param into - Session owning the target composer; defaults to the Session on screen.
   */
  fill(mark: Mark, into?: string): void
  /** Open the markboard page for the Session on screen. */
  openPanel(): void
  /** @param text - notice body. @param action - optional single action. */
  notify(text: string, action?: Toast['action']): void
  /** Drop the current notice. */
  dismissToast(): void
}

/**
 * Everything the seats call, bound to the root context.
 */
export class MarkboardSurfaceImpl implements MarkboardSurface {
  readonly marks: ObservableSnapshot<readonly Mark[]>
  readonly toast: ObservableSnapshot<Toast | undefined>
  readonly shortcut: ObservableSnapshot<string>
  private toastSeq = 0
  private toastState: Toast | undefined
  private readonly toastListeners = new Set<() => void>()
  private readonly shortcutListeners = new Set<() => void>()
  private shortcutLabel = ''
  private readonly offShortcut: () => void
  private readonly t: Translate

  /**
   * @param ctx - client root context.
   * @param board - live mark store.
   * @param t - markboard translator.
   */
  constructor(
    private readonly ctx: ClientContext,
    private readonly board: Markboard,
    t: Translate,
  ) {
    this.t = t
    this.marks = {
      getSnapshot: () => board.getSnapshot(),
      subscribe: board.subscribe.bind(board),
    }
    this.toast = {
      getSnapshot: () => this.toastState,
      subscribe: (listener) => {
        this.toastListeners.add(listener)
        return () => { this.toastListeners.delete(listener) }
      },
    }
    this.shortcut = {
      getSnapshot: () => this.shortcutLabel,
      subscribe: (listener) => {
        this.shortcutListeners.add(listener)
        return () => { this.shortcutListeners.delete(listener) }
      },
    }
    this.offShortcut = this.watchShortcut()
  }

  /** Release the shortcut catalog subscription. */
  dispose(): void {
    this.offShortcut()
  }

  private watchShortcut(): () => void {
    const shortcuts = this.ctx.get('shortcuts') as {
      catalog?: ObservableSnapshot<readonly { id: string; keys: readonly string[] }[]>
    } | undefined
    const catalog = shortcuts?.catalog
    if (catalog === undefined) return () => {}
    const sync = (): void => {
      const entry = catalog.getSnapshot().find(candidate => candidate.id === 'markboard.open')
      const next = entry === undefined ? '' : entry.keys.join('+')
      if (next === this.shortcutLabel) return
      this.shortcutLabel = next
      for (const listener of [...this.shortcutListeners]) listener()
    }
    sync()
    return catalog.subscribe(sync)
  }

  capture(source: TurnSource, turn: number, seq: number, sessionId: string): TurnFacts {
    const prompt = (source.turnDataSource(turn, 'user').getSnapshot() as readonly { content?: readonly unknown[] }[])
      .map(data => textOfContent(data.content))
      .join('\n')
    const response = (source.turnDataSource(turn, 'assistant-step').getSnapshot() as readonly { blocks?: readonly { kind?: string; text?: string }[] }[])
      .map(data => (data.blocks ?? []).filter(block => block.kind === 'text').map(block => block.text ?? '').join(''))
      .join('\n')
    return { sessionId, sessionTitle: this.titleOf(sessionId), turn, seq, prompt, response }
  }

  titleOf(sessionId: string): string {
    const row = this.ctx.sessions.list.getSnapshot().byId[sessionId as SessionId]
    return row?.displayTitle ?? ''
  }

  markFor(sessionId: string, turn: number): Mark | undefined {
    return this.board.getSnapshot().find(mark => mark.sessionId === sessionId && mark.turn === turn)
  }

  mark(facts: TurnFacts, label?: string): boolean {
    const result = this.board.mark({
      sessionId: facts.sessionId,
      sessionTitle: facts.sessionTitle,
      turn: facts.turn,
      seq: facts.seq,
      prompt: facts.prompt,
      response: facts.response,
      ...(label === undefined || label === '' ? {} : { label }),
    }, crypto.randomUUID())
    if (!result.ok) {
      this.notify(this.t('panel.storageFailed'))
      return false
    }
    const mark = result.mark
    this.notify(this.t('toast.marked', { label: mark.label === '' ? defaultLabel(mark.prompt) : mark.label }), {
      label: this.t('action.undo'),
      run: () => { this.board.unmark(mark.id) },
    })
    return true
  }

  unmark(id: string): void {
    this.board.unmark(id)
    this.notify(this.t('toast.unmarked'))
  }

  relabel(id: string, label: string): void {
    if (!this.board.relabel(id, label).ok) this.notify(this.t('panel.storageFailed'))
  }

  remove(id: string): void {
    const before = [...this.board.getSnapshot()]
    if (!before.some(mark => mark.id === id)) return
    this.board.unmark(id)
    this.notify(this.t('toast.deleted'), {
      label: this.t('action.undo'),
      run: () => { this.board.restore(before) },
    })
  }

  notify(text: string, action?: Toast['action']): void {
    this.toastSeq += 1
    this.toastState = { id: this.toastSeq, text, ...(action === undefined ? {} : { action }) }
    for (const listener of [...this.toastListeners]) listener()
  }

  dismissToast(): void {
    if (this.toastState === undefined) return
    this.toastState = undefined
    for (const listener of [...this.toastListeners]) listener()
  }

  openPanel(): void {
    if (this.ctx.sidebarRight.mounted.getSnapshot() === undefined) {
      this.notify(this.t('panel.noSession'))
      return
    }
    try {
      this.ctx.sidebarRight.openTab(TAB_KIND)
    } catch (error) {
      console.error('[dsh-markboard] could not open the panel:', error)
      this.notify(this.t('panel.noSession'))
    }
  }

  jump(mark: Mark): void {
    const run = async (): Promise<void> => {
      if (this.ctx.sidebarRight.mounted.getSnapshot() !== mark.sessionId) {
        this.ctx.uiWorkspace.openSession(mark.sessionId as SessionId)
      }
      const row = await this.locate(mark)
      if (row === undefined) {
        this.notify(this.t('toast.jumpFailed'))
        return
      }
      row.scrollIntoView({ block: 'center', behavior: 'smooth' })
      row.classList.add('mb-flash')
      window.setTimeout(() => { row.classList.remove('mb-flash') }, 1400)
    }
    void run()
  }

  /**
   * Find the Turn's row, paging its history in when the window lacks it.
   * @param mark - the mark whose Turn to find.
   * @returns the row element, or `undefined` when it never materialized.
   */
  private async locate(mark: Mark): Promise<HTMLElement | undefined> {
    const first = this.rowOf(mark)
    if (first !== undefined) return first
    await this.pageTo(mark)
    for (let attempt = 0; attempt < 24; attempt++) {
      await delay(attempt === 0 ? 60 : 250)
      const row = this.rowOf(mark)
      if (row !== undefined) return row
    }
    return undefined
  }

  private rowOf(mark: Mark): HTMLElement | undefined {
    const scope = document.querySelector(`[data-conversation-session="${mark.sessionId}"]`)
    const root: ParentNode = scope ?? document
    return root.querySelector<HTMLElement>(`[data-chat-turn="${mark.turn}"]`) ?? undefined
  }

  private async pageTo(mark: Mark): Promise<void> {
    try {
      const binding = this.ctx.sessions.binding(mark.sessionId as SessionId)
      if (binding === undefined) return
      await binding.session.loadThrough(mark.seq as SessionSeq)
    } catch (error) {
      console.error('[dsh-markboard] history paging failed:', error)
    }
  }

  /**
   * Put the mark's answer into a composer as a plain-text quote.
   *
   * The quote lands where the user is typing, not where the mark came from: a
   * card from another Session is carried into the composer on screen instead of
   * opening that Session. Filling a mark's own Session replaces its draft, while
   * carrying one across appends — text already typed for the current Session
   * survives. Either way the previous draft is one undo away.
   *
   * @param mark - the mark to quote.
   * @param into - Session owning the target composer; defaults to the Session on screen.
   */
  fill(mark: Mark, into?: string): void {
    const text = draftText(mark, this.t('panel.turn', { turn: mark.turn }))
    const target = fillTarget(mark, into, this.ctx.sidebarRight.mounted.getSnapshot())
    if (target === undefined) {
      this.notify(this.t('panel.noSession'))
      return
    }
    const binding = this.ctx.sessions.binding(target.sessionId as SessionId)
    if (binding === undefined) {
      this.notify(this.t('toast.fillFailed'))
      return
    }
    // Read the target draft first: the initialization below overwrites it.
    const previous = this.draftOf(target.sessionId)
    if (!this.initialize(binding, text, target.mode)) {
      this.notify(this.t('toast.fillFailed'))
      return
    }
    const title = this.titleOf(mark.sessionId) === '' ? mark.sessionId : this.titleOf(mark.sessionId)
    this.notify(
      target.mode === 'replace' ? this.t('toast.filled') : this.t('toast.filledOther', { title }),
      previous === undefined || previous === ''
        ? undefined
        : {
            label: this.t('action.undo'),
            run: () => {
              this.initialize(binding, previous, 'replace')
              this.dismissToast()
            },
          },
    )
  }

  /**
   * Hand one draft initialization to the input facade, swallowing the refusal a
   * Session teardown between lookup and call would raise.
   * @param binding - target Session generation.
   * @param prompt - text to place.
   * @param mode - replace the draft, or append after what is already typed.
   * @returns whether the composer took the text.
   */
  private initialize(binding: SessionBinding, prompt: string, mode: 'replace' | 'append'): boolean {
    const options: DraftInitializationOptions = mode === 'append'
      ? { prompt, whenDraftExists: 'append' }
      : { prompt, whenDraftExists: 'replace' }
    let result: DraftInitializationResult
    try {
      result = this.ctx.conversation.input.requestDraftInitialization(binding, options)
    } catch (error) {
      console.error('[dsh-markboard] draft initialization failed:', error)
      return false
    }
    return result === 'applied'
  }

  /** The Session's draft before this fill, read from the input facade the shell owns. */
  private draftOf(sessionId: string): string | undefined {
    try {
      const binding = this.ctx.sessions.binding(sessionId as SessionId)
      if (binding === undefined) return undefined
      return this.ctx.conversation.input.for(binding.ctx).state.getSnapshot().draft
    } catch {
      return undefined
    }
  }
}

/** Read the plain text out of one message content array. */
function textOfContent(content: readonly unknown[] | undefined): string {
  if (content === undefined) return ''
  const parts: string[] = []
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    const record = block as { type?: unknown; text?: unknown }
    if (record.type === 'text' && typeof record.text === 'string') parts.push(record.text)
  }
  return parts.join('\n')
}

/** One bounded wait, used by the reveal flow. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => { window.setTimeout(resolve, ms) })
}
