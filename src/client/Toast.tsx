/**
 * The one transient notice the markboard shows, mounted at `shell.overlay`.
 *
 * The overlay is frame-wide, so a mark made in the transcript and a fill made
 * from the panel both surface here without each seat owning its own timer.
 *
 * @module dsh-markboard/client/Toast
 */

import { memo, useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './kind.ts'
import type { MarkboardSurface, Toast as ToastState } from './surface.ts'

/** Full props of the toast entry. */
export type MarkboardToastProps =
  PropsRuntime<'shell.overlay'>
  & InjectFace<{ readonly board: MarkboardSurface }>
  & PropsLocale<typeof NS>

/** How long a notice stays before fading, matching the shell's own toast. */
const HOLD_MS = 4000

/**
 * Render the current notice.
 * @param props - the shared surface.
 * @returns the notice, or nothing.
 */
export const MarkboardToast = memo(function MarkboardToast({ board }: MarkboardToastProps) {
  const toast = useToast(board)
  useEffect(() => {
    if (toast === undefined) return
    const timer = window.setTimeout(() => { board.dismissToast() }, HOLD_MS)
    return () => { window.clearTimeout(timer) }
  }, [board, toast])
  if (toast === undefined) return null
  return (
    <div className="mb-toast" role="status" aria-live="polite">
      <span>{toast.text}</span>
      {toast.action === undefined ? null : (
        <button
          type="button"
          onClick={() => {
            toast.action?.run()
            board.dismissToast()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
})

/** Bind the surface's notice source. */
function useToast(board: MarkboardSurface): ToastState | undefined {
  const [toast, setToast] = useState(() => board.toast.getSnapshot())
  useEffect(() => {
    setToast(board.toast.getSnapshot())
    return board.toast.subscribe(() => { setToast(board.toast.getSnapshot()) })
  }, [board])
  return toast
}
