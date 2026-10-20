/**
 * The markboard page: the list, its two scopes and search, and each card's
 * actions.
 *
 * The page is registered as a right-Sidebar tab type, so it keeps its own tab,
 * can be split or floated like any other page, and re-opens where the user left
 * it. It renders for one Session at a time; the "all sessions" scope is a view
 * over the same store, not a second page.
 *
 * @module dsh-markboard/client/MarkboardBody
 */

import { memo, useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './kind.ts'
import type { MarkboardSurface, Translate } from './surface.ts'
import type { Mark } from '../shared/marks.ts'
import { select } from '../shared/marks.ts'
import { useMarks } from './MarkAction.tsx'
import { Icon, ICON_ARROW, ICON_CLOSE, ICON_FILL, ICON_SEARCH } from './icons.tsx'

/** Full props of the markboard page body. */
export type MarkboardBodyProps =
  PropsRuntime<'sidebar.right.pane.tab'>
  & InjectFace<{ readonly board: MarkboardSurface }>
  & PropsLocale<typeof NS>

/** Full props of the tab chip title (static copy only, no business face). */
export type MarkboardTitleProps =
  PropsRuntime<'sidebar.right.pane.tab.title'>
  & PropsLocale<typeof NS>

/** Which Sessions the list shows. */
type Scope = 'session' | 'all'

/**
 * Render the markboard.
 * @param props - the Session, the shared surface, and copy.
 * @returns the page.
 */
export const MarkboardBody = memo(function MarkboardBody({ sessionId, board, t }: MarkboardBodyProps) {
  const marks = useMarks(board)
  const shortcut = useShortcut(board)
  const [scope, setScope] = useState<Scope>('session')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ id: string; value: string } | undefined>(undefined)

  const sessionCount = useMemo(
    () => marks.filter(mark => mark.sessionId === sessionId).length,
    [marks, sessionId],
  )
  const rows = useMemo(() => select(marks, scope, sessionId, query), [marks, scope, sessionId, query])
  const allCount = marks.length
  const inAllScope = scope === 'all'

  const commitRename = useCallback(() => {
    if (editing === undefined) return
    board.relabel(editing.id, editing.value)
    setEditing(undefined)
  }, [board, editing])

  const onRenameKey = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault()
      commitRename()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(undefined)
    }
  }, [commitRename])

  return (
    <div className="mb-panel" data-dsh-markboard-panel="">
      <div className="mb-panel-head">
        <div className="mb-panel-title">
          <span>{t('panel.title')}</span>
          <span className="mb-count">{allCount}</span>
          <span className="mb-grow" />
        </div>
        <label className="mb-search">
          <Icon path={ICON_SEARCH} size={13} />
          <input
            type="search"
            value={query}
            placeholder={t('panel.search')}
            aria-label={t('panel.search')}
            onChange={(event) => { setQuery(event.target.value) }}
          />
        </label>
        <div className="mb-filters">
          <button
            type="button"
            className="mb-chip"
            data-on={scope === 'session' ? '' : undefined}
            aria-pressed={scope === 'session'}
            onClick={() => { setScope('session') }}
          >
            {t('panel.scope.session', { count: sessionCount })}
          </button>
          <button
            type="button"
            className="mb-chip"
            data-on={inAllScope ? '' : undefined}
            aria-pressed={inAllScope}
            onClick={() => { setScope('all') }}
          >
            {t('panel.scope.all', { count: allCount })}
          </button>
        </div>
      </div>

      <div className="mb-list">
        {rows.length === 0
          ? <p className="mb-empty">{emptyCopy(marks.length, sessionId, query, scope, t)}</p>
          : rows.map(mark => (
            <article className="mb-card" key={mark.id} data-dsh-markboard-card="" data-mark-id={mark.id}>
              <div className="mb-card-head">
                <span className="mb-turn">{t('panel.turn', { turn: mark.turn })}</span>
                {editing?.id === mark.id
                  ? (
                    <input
                      autoFocus
                      value={editing.value}
                      maxLength={60}
                      aria-label={t('dialog.label')}
                      className="mb-rename"
                      onChange={(event) => { setEditing({ id: mark.id, value: event.target.value }) }}
                      onKeyDown={onRenameKey}
                      onBlur={commitRename}
                    />
                  )
                  : (
                    <button
                      type="button"
                      className="mb-card-label"
                      title={t('action.rename')}
                      onClick={() => { setEditing({ id: mark.id, value: mark.label }) }}
                    >
                      {mark.label === '' ? t('panel.turn', { turn: mark.turn }) : mark.label}
                    </button>
                  )}
                <span className="mb-when">{whenLabel(mark.createdAt, t)}</span>
              </div>
              <p className="mb-preview">{mark.response === '' ? mark.prompt : mark.response}</p>
              <div className="mb-card-foot">
                {inAllScope
                  ? (
                    <span className="mb-badge" title={mark.sessionTitle}>
                      {mark.sessionTitle === '' ? mark.sessionId : mark.sessionTitle}
                    </span>
                  )
                  : null}
                <span className="mb-grow" />
                <button type="button" className="mb-btn" data-primary="" onClick={() => { board.jump(mark) }}>
                  <Icon path={ICON_ARROW} size={12} />
                  {t('action.jump')}
                </button>
                <button type="button" className="mb-btn" onClick={() => { board.fill(mark) }}>
                  <Icon path={ICON_FILL} size={12} />
                  {t('action.fill')}
                </button>
                <button
                  type="button"
                  className="mb-btn"
                  data-danger=""
                  aria-label={t('action.delete')}
                  title={t('action.delete')}
                  onClick={() => { board.remove(mark.id) }}
                >
                  <Icon path={ICON_CLOSE} size={12} />
                  {t('action.delete')}
                </button>
              </div>
            </article>
          ))}
      </div>

      <div className="mb-panel-foot">
        {t('panel.localOnly', { shortcut: shortcut === '' ? '—' : shortcut })}
      </div>
    </div>
  )
})

/**
 * The chip title for the tab strip.
 * @param props - the tab's locale seat.
 * @returns the localized page title.
 */
export const MarkboardTitle = memo(function MarkboardTitle({ t }: MarkboardTitleProps) {
  return <span>{t('panel.title')}</span>
})

/**
 * Empty-state copy chosen from the current state rather than from a render branch.
 * @param total - number of marks across every Session.
 * @param sessionId - the Session the page is bound to.
 * @param query - active search text.
 * @param scope - active scope.
 * @param t - markboard translator.
 * @returns the sentence to show.
 */
function emptyCopy(total: number, sessionId: string, query: string, scope: Scope, t: Translate): string {
  if (sessionId === '') return t('panel.noSession')
  if (query !== '') return t('panel.emptySearch')
  if (scope === 'all' || total === 0) return t('panel.empty')
  return t('panel.emptySession')
}

/**
 * Relative-time label: today by clock, this week by weekday, then the date.
 * @param createdAt - epoch milliseconds.
 * @param t - markboard translator.
 * @returns the label.
 */
function whenLabel(createdAt: number, t: Translate): string {
  const now = Date.now()
  const then = new Date(createdAt)
  const elapsed = now - createdAt
  const minute = 60_000
  const hour = 60 * minute
  if (elapsed < minute) return t('time.now')
  if (elapsed < hour) return t('time.minutes', { count: Math.floor(elapsed / minute) })
  if (new Date(now).toDateString() === then.toDateString()) {
    return then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  if (elapsed < 7 * 24 * hour) return then.toLocaleDateString(undefined, { weekday: 'short' })
  return then.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
}

/**
 * Bind the surface's shortcut label.
 * @param board - shared surface.
 * @returns the key label, or the empty string while unbound.
 */
function useShortcut(board: MarkboardSurface): string {
  const [label, setLabel] = useState(() => board.shortcut.getSnapshot())
  useEffect(() => {
    setLabel(board.shortcut.getSnapshot())
    return board.shortcut.subscribe(() => { setLabel(board.shortcut.getSnapshot()) })
  }, [board])
  return label
}

export type { Mark }
