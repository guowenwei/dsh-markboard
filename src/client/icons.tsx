/**
 * Inline SVGs for the markboard.
 *
 * The seats live in a third-party bundle; drawing four glyphs locally keeps the
 * bundle free of the shell's icon catalogue and of any assumptions about icon
 * names that may move between releases. Everything is `currentColor` with a
 * 1.6 stroke, matching the surrounding 16px action glyphs.
 *
 * @module dsh-markboard/client/icons
 */

import type { ReactNode } from 'react'

/** Bookmark outline path; filled by the marked state. */
export const ICON_BOOKMARK = 'M4.5 3.5h7a1 1 0 0 1 1 1v9.2l-4.5-2.7-4.5 2.7V4.5a1 1 0 0 1 1-1Z'
/** Magnifier. */
export const ICON_SEARCH = 'M7.2 11.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm3.1-.3 2.9 2.9'
/** Cross used by the dismiss control. */
export const ICON_CLOSE = 'm4.5 4.5 7 7m0-7-7 7'
/** Arrow that leaves the card, used by the jump action. */
export const ICON_ARROW = 'M4 8h8m-3-3 3 3-3 3'
/** Downward arrow into a line, used by the composer-fill action. */
export const ICON_FILL = 'M8 3.5v6m-2.4-2.4L8 9.5l2.4-2.4M4 12.5h8'

/**
 * Draw one 16px glyph.
 * @param props - path data, optional fill for the active state, and a size.
 * @returns the SVG element.
 */
export function Icon({ path, filled = false, size = 14, title }: {
  path: string
  filled?: boolean
  size?: number
  title?: string
}): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title === undefined ? true : undefined}
      role={title === undefined ? undefined : 'img'}
      focusable="false"
    >
      {title === undefined ? null : <title>{title}</title>}
      <path d={path} />
    </svg>
  )
}
