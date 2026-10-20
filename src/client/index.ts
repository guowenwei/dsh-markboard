/**
 * The markboard client plugin entry.
 *
 * Three contributions, each at an existing extension seat:
 *   1. `conversation.chat.turnTail`             — the per-Turn Mark action
 *   2. `conversation.session.header.utilities`  — the Session mark count/entry
 *   3. `ctx.sidebarRightTabs` + the keyed seats — the markboard page
 *
 * No feature plugin is imported for its runtime value: every cross-package edge
 * is a type-only declaration merge, and behaviour arrives through injected
 * Cordis services.
 *
 * @module dsh-markboard/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the SlotMap merges this plugin contributes to.
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: `ctx.uiWorkspace`, `ctx.sidebarRight`, `ctx.sidebarRightTabs`, `ctx.shortcuts`, `ctx.sessions`.
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import { MarkAction } from './MarkAction.tsx'
import { HeaderAction } from './HeaderAction.tsx'
import { MarkboardBody, MarkboardTitle } from './MarkboardBody.tsx'
import { MarkboardToast } from './Toast.tsx'
import { installStyles } from './styles.ts'
import { MarkboardSurfaceImpl, type MarkboardSurface } from './surface.ts'
import { NS, SHORTCUT_ID, TAB_ID, TAB_KIND } from './kind.ts'
import { en, zh } from '../shared/locales.ts'
import { createMarkboard } from '../shared/store.ts'
import { STORAGE_KEY } from '../shared/marks.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** The live markboard, for plugins that want to add or read marks programmatically. */
    markboard: MarkboardSurface
  }
}

/** Services this plugin waits for; the fiber stays pending until all are present. */
export const inject = [
  'slots', 'locale', 'sidebarRight', 'sidebarRightTabs', 'shortcuts',
  'uiWorkspace', 'sessions', 'conversation',
]

/**
 * Mount the markboard.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // Wrapped so a failure inside this body names the plug-in in the console and
  // the boot audit instead of surfacing as a bare "entry failed".
  try {
    mount(ctx)
  } catch (error) {
    console.error('[dsh-markboard] activation failed:', error)
    throw error
  }
}

/**
 * The real plugin body.
 * @param ctx - client root context.
 */
function mount(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'markboard: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'markboard: dictionaries')

  const board = createMarkboard(() => crypto.randomUUID())
  // Another tab of the same origin may have written marks; adopt its list so
  // two open windows do not drift apart. `refresh` re-reads and notifies.
  ctx.effect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== null && event.key !== STORAGE_KEY) return
      board.refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, 'markboard: cross-tab storage')

  const surface = new MarkboardSurfaceImpl(ctx, board, ctx.locale.bind(NS))
  ctx.effect(() => () => { surface.dispose() }, 'markboard: surface')
  ctx.provide('markboard', surface)

  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
    name: 'conversation.chat.turnTail',
    id: 'markboard',
    order: 60,
    locale: NS,
    inject: () => ({ board: surface }),
  }, MarkAction))

  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'markboard',
    order: 40,
    locale: NS,
    inject: () => ({ board: surface }),
  }, HeaderAction))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'markboard-toast',
    order: 70,
    locale: NS,
    inject: () => ({ board: surface }),
  }, MarkboardToast))

  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => ctx.locale.bind(NS)('panel.title'),
    guide: [{
      id: 'markboard',
      order: 30,
      title: () => ctx.locale.bind(NS)('panel.title'),
      description: () => ctx.locale.bind(NS)('panel.empty'),
    }],
  }), 'markboard: tab type')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TAB_ID,
    locale: NS,
    inject: () => ({ board: surface }),
  }, MarkboardBody)), 'markboard: tab body')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab.title',
    key: TAB_ID,
    locale: NS,
    inject: () => ({ board: surface }),
  }, MarkboardTitle)), 'markboard: tab title')

  ctx.effect(() => ctx.shortcuts.register({
    id: SHORTCUT_ID as Parameters<ClientContext['shortcuts']['register']>[0]['id'],
    label: () => ctx.locale.bind(NS)('panel.title'),
    aliases: ['marks', 'markboard', '标记', '标记板'],
    // Web input only accepts two-modifier combinations that include the platform
    // primary (and Linux accepts a fixed short list), so the browser profiles are
    // named explicitly and the Linux web profile is left unbound rather than
    // registering a default the registry would reject.
    defaults: {
      'web:windows': { code: 'KeyM', modifiers: ['primary', 'alt'] },
      'web:macos': { code: 'KeyM', modifiers: ['primary', 'alt'] },
      'desktop:windows': { code: 'KeyM', modifiers: ['primary', 'alt'] },
      'desktop:macos': { code: 'KeyM', modifiers: ['primary', 'alt'] },
      'desktop:linux': { code: 'KeyM', modifiers: ['primary', 'alt'] },
    },
    regions: ['page', 'editable', 'terminal'],
    modals: [],
    resolve: ({ target }) => {
      const command = ctx.sidebarRight.commandTarget(target)
      if (command === undefined) {
        return { status: 'blocked', reason: ctx.locale.bind(NS)('panel.noSession') }
      }
      return { status: 'handled', run: () => { ctx.sidebarRight.openTabFromTarget(TAB_KIND, command) } }
    },
  }), 'markboard: open shortcut')
}
