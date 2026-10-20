/**
 * The Session-header entry: the on-screen Session's mark count, and the way
 * back into the markboard when its tab is closed or the column collapsed.
 *
 * @module dsh-markboard/client/HeaderAction
 */

import { memo, useCallback } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { MarkboardSurface } from './surface.ts'
import type { NS } from './kind.ts'
import { useMarks } from './MarkAction.tsx'
import { Icon, ICON_BOOKMARK } from './icons.tsx'

/** Full props of the header entry. */
export type HeaderActionProps =
  PropsRuntime<'conversation.session.header.utilities'>
  & InjectFace<{ readonly board: MarkboardSurface }>
  & PropsLocale<typeof NS>

/**
 * Session mark count and panel entry.
 * @param props - the Session, the shared surface, and copy.
 * @returns the header chip, or nothing while the Session has no marks.
 */
export const HeaderAction = memo(function HeaderAction({ sessionId, board, t }: HeaderActionProps) {
  const marks = useMarks(board)
  const count = marks.filter(mark => mark.sessionId === sessionId).length
  const open = useCallback(() => { board.openPanel() }, [board])

  if (count === 0) return null
  const label = t('header.count', { count })
  return (
    <button
      type="button"
      className="mb-header-action"
      // The visible chip is icon+count; the accessible name states both and the
      // chip's purpose, so a screen reader does not announce a bare number.
      aria-label={`${label} · ${t('header.open')}`}
      title={t('header.open')}
      data-dsh-markboard-entry=""
      onClick={open}
    >
      <Icon path={ICON_BOOKMARK} filled />
      <span className="mb-header-count">{count}</span>
    </button>
  )
})
