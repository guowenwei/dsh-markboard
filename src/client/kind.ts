/**
 * Stable identifiers the entry module and the seats both need.
 *
 * A separate tiny module avoids a cycle: the entry imports the components, and
 * the components would otherwise import the entry for the tab kind.
 */

/** Page kind registered with `ctx.sidebarRightTabs` and used by `openTab`. */
export const TAB_KIND = 'markboard'

/** Tab type id; also the keyed seat key for the body and title. */
export const TAB_ID = 'dsh-markboard'

/** Copy namespace. */
export const NS = 'markboard'

/** Shortcut command id that opens the panel. */
export const SHORTCUT_ID = 'markboard.open'
