/**
 * Markboard copy, both languages in one module so the key set is checked by
 * the compiler instead of a test. The namespace is registered with
 * `ctx.locale.register('markboard', { zh, en })`.
 */

/** Simplified Chinese dictionary; the key-set source of truth. */
export const zh = {
  'action.mark': '标记',
  'action.marked': '已标记',
  'action.unmark': '取消标记',
  'action.undo': '撤销',
  'action.jump': '跳转',
  'action.fill': '填入输入框',
  'action.rename': '重命名',
  'action.delete': '删除',
  'header.count': '标记 {count}',
  'header.open': '打开标记板',
  'panel.title': '标记',
  'panel.scope.session': '本会话 {count}',
  'panel.scope.all': '全部会话 {count}',
  'panel.search': '搜索标题、内容或轮次',
  'panel.empty': '还没有标记。在任意一轮回答下方点「标记」，它就会出现在这里。',
  'panel.emptySearch': '没有匹配的标记',
  'panel.emptySession': '本会话还没有标记',
  'panel.noSession': '先打开一个会话',
  'panel.storageFailed': '标记无法保存：浏览器存储不可用或已满',
  'panel.localOnly': '标记保存在本机 · {shortcut} 打开',
  'panel.turn': '第 {turn} 轮',
  'time.now': '刚刚',
  'time.minutes': '{count} 分钟前',
  'dialog.label': '任务名',
  'toast.marked': '已标记 · {label}',
  'toast.unmarked': '已取消标记',
  'toast.filled': '已填入输入框 · 可继续编辑',
  'toast.fillFailed': '当前会话不可输入，稍后重试',
  'toast.jumpFailed': '这一轮还没载入，请先在会话中向上加载更早历史',
  'toast.deleted': '已删除标记',
} satisfies Record<string, string>

/** The markboard namespace key union. */
export type MarkboardKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The markboard's copy. */
    markboard: MarkboardKey
  }
}

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'action.mark': 'Mark',
  'action.marked': 'Marked',
  'action.unmark': 'Remove mark',
  'action.undo': 'Undo',
  'action.jump': 'Jump',
  'action.fill': 'Fill composer',
  'action.rename': 'Rename',
  'action.delete': 'Delete',
  'header.count': 'Marks {count}',
  'header.open': 'Open the markboard',
  'panel.title': 'Marks',
  'panel.scope.session': 'This session {count}',
  'panel.scope.all': 'All sessions {count}',
  'panel.search': 'Search label, content, or turn',
  'panel.empty': 'No marks yet. Use “Mark” under any answer and it shows up here.',
  'panel.emptySearch': 'No marks match',
  'panel.emptySession': 'No marks in this session yet',
  'panel.noSession': 'Open a session first',
  'panel.storageFailed': 'Marks cannot be saved: browser storage is unavailable or full',
  'panel.localOnly': 'Marks stay on this device · {shortcut} to open',
  'panel.turn': 'Turn {turn}',
  'time.now': 'Just now',
  'time.minutes': '{count} min ago',
  'dialog.label': 'Task name',
  'toast.marked': 'Marked · {label}',
  'toast.unmarked': 'Mark removed',
  'toast.filled': 'Filled the composer · keep editing',
  'toast.fillFailed': 'This session is not accepting input right now',
  'toast.jumpFailed': 'That turn is not loaded yet; scroll up to load older history first',
  'toast.deleted': 'Mark deleted',
} satisfies Record<MarkboardKey, string>
