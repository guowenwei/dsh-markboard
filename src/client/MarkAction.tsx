/**
 * Per-Turn Mark action for the completed Turn's action row.
 *
 * One click records the Turn under its derived task name and announces the
 * result with an undo action; naming and renaming happen on the markboard card,
 * so the transcript keeps a single quiet control. A second click removes the
 * mark.
 *
 * @module dsh-markboard/client/MarkAction
 */

import { memo, useCallback, useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client'
import type { MarkboardSurface } from './surface.ts'
import type { NS } from './kind.ts'
import type { Mark } from '../shared/marks.ts'
import { Icon, ICON_BOOKMARK } from './icons.tsx'

/** Full props of the mark action entry. */
export type MarkActionProps =
  PropsRuntime<'conversation.chat.turnTail'>
  & InjectFace<{ readonly board: MarkboardSurface }>
  & PropsLocale<typeof NS>

/**
 * One Turn's mark toggle.
 * @param props - the Turn, the shared surface, and copy.
 * @returns the action button.
 */
export const MarkAction = memo(function MarkAction({ turn: location, seq, sessionId, board, useChat, t }: MarkActionProps) {
  // The owner currency is the Turn's location record, not its number; the
  // number is what a mark stores, so it is unwrapped here once.
  const turn = location.turn
  const marked = useMarkFor(turn, sessionId, board)
  // The node store keeps a stable identity, so this selector never re-renders
  // the button on streaming deltas; the Turn's data is read at click time.
  const nodes = useChat(snapshot => snapshot.nodes)

  const onClick = useCallback(() => {
    if (marked !== undefined) {
      board.unmark(marked.id)
      return
    }
    board.mark(board.capture(nodes, turn, seq, sessionId))
  }, [board, marked, nodes, seq, sessionId, turn])

  const label = marked === undefined ? t('action.mark') : t('action.unmark')
  return (
    <button
      type="button"
      className="mb-mark-action"
      data-marked={marked === undefined ? undefined : ''}
      aria-pressed={marked !== undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon path={ICON_BOOKMARK} filled={marked !== undefined} />
      <span>{marked === undefined ? t('action.mark') : t('action.marked')}</span>
    </button>
  )
})

/** Subscribe to whether this Turn is marked, sharing the board's list snapshot. */
function useMarkFor(turn: number, sessionId: string, board: MarkboardSurface): Mark | undefined {
  const marks = useMarks(board)
  return marks.find(mark => mark.sessionId === sessionId && mark.turn === turn)
}

/**
 * Bind the board's mark list to a component.
 * @param board - the shared surface.
 * @returns the current marks, newest first.
 */
export function useMarks(board: MarkboardSurface): readonly Mark[] {
  const [snapshot, setSnapshot] = useState(() => board.marks.getSnapshot())
  useEffect(() => {
    setSnapshot(board.marks.getSnapshot())
    return board.marks.subscribe(() => { setSnapshot(board.marks.getSnapshot()) })
  }, [board])
  return snapshot
}

/**
 * Bind one plain observable to a component.
 * @param source - observable value.
 * @returns its current value.
 */
export function useSource<T>(source: { getSnapshot(): T; subscribe(listener: () => void): () => void }): T {
  const [snapshot, setSnapshot] = useState(() => source.getSnapshot())
  useEffect(() => {
    setSnapshot(source.getSnapshot())
    return source.subscribe(() => { setSnapshot(source.getSnapshot()) })
  }, [source])
  return snapshot
}

export type { ChatSnapshot }
