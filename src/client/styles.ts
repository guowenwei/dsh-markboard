/**
 * The markboard's one stylesheet.
 *
 * A third-party bundle cannot use the shell's CSS-module pipeline, so the rules
 * live here as text and a single `<style data-plugin>` tag is installed once per
 * page load. Every colour, radius, and elevation comes from the shell's semantic
 * tokens (`--dsw-alias-*`, `--dsw-elevation-*`), so both themes work without a
 * theme branch in this file.
 */

/** Stable style-tag id; a hot reload replaces its contents instead of stacking tags. */
const STYLE_ID = 'dsh-markboard/styles'

const CSS = `
.mb-mark-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.mb-mark-action:hover,
.mb-mark-action:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.mb-mark-action[data-marked] {
  color: var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-state-business-tertiary);
  font-weight: 600;
}
.mb-mark-action[data-marked]:hover {
  background: var(--dsw-alias-state-business-tertiary);
}
.mb-mark-action:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}

.mb-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 2px;
  padding: 6px 8px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.mb-editor input {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12.5px;
  line-height: 18px;
}
.mb-editor input:focus {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.mb-editor button {
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  font: inherit;
  font-size: 11.5px;
  line-height: 16px;
  cursor: pointer;
}
.mb-editor button[data-kind='save'] {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}
.mb-editor button[data-kind='save']:hover {
  background: var(--dsw-alias-button-primary-hover);
}
.mb-editor button[data-kind='cancel'] {
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
}
.mb-editor button[data-kind='cancel']:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}

.mb-header-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 11.5px;
  line-height: 16px;
  cursor: pointer;
}
.mb-header-action:hover,
.mb-header-action:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.mb-header-action[data-active] {
  color: var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-state-business-tertiary);
}
.mb-header-action:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.mb-header-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.mb-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  height: 100%;
  color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
  line-height: 18px;
}
.mb-panel-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
}
.mb-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
}
.mb-panel-title .mb-grow { flex: 1; }
.mb-count {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--dsw-alias-state-business-tertiary);
  color: var(--dsw-alias-state-business-primary);
  font-size: 10.5px;
  line-height: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.mb-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 9px;
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-tertiary);
}
.mb-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
}
.mb-search input:focus { outline: none; }
.mb-search:focus-within {
  box-shadow: inset 0 0 0 2px var(--dsw-alias-state-business-primary);
}
.mb-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.mb-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.mb-chip:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.mb-chip[data-on] {
  border-color: transparent;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-label-primary-foreground);
}
.mb-chip:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}

.mb-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 12px 12px;
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}
.mb-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-base);
}
.mb-card[data-active] {
  border-color: var(--dsw-alias-state-business-primary);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-state-business-primary);
}
.mb-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.mb-turn {
  flex: none;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--dsw-alias-state-business-tertiary);
  color: var(--dsw-alias-state-business-primary);
  font-size: 10px;
  line-height: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.mb-card-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.mb-card-label:hover { text-decoration: underline dotted; text-underline-offset: 3px; }
.mb-card-label:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.mb-rename {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 0;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12.5px;
  line-height: 18px;
}
.mb-rename:focus {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.mb-when {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
  line-height: 15px;
  font-variant-numeric: tabular-nums;
}
.mb-preview {
  color: var(--dsw-alias-label-secondary);
  font-size: 11.5px;
  line-height: 16px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.mb-card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.mb-grow { flex: 1; min-width: 0; }
.mb-badge {
  max-width: 42%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 14px;
}
.mb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
}
.mb-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.mb-btn[data-primary] {
  border-color: transparent;
  background: var(--dsw-alias-state-business-tertiary);
  color: var(--dsw-alias-state-business-primary);
  font-weight: 600;
}
.mb-btn[data-primary]:hover {
  background: var(--dsw-alias-interactive-bg-hover-accent);
}
.mb-btn[data-danger]:hover {
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-label, var(--dsw-alias-label-primary));
}
.mb-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.mb-empty {
  margin: 8px 2px;
  padding: 14px 12px;
  border: 0.5px dashed var(--dsw-alias-border-l2);
  border-radius: 12px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11.5px;
  line-height: 17px;
  text-align: center;
}
.mb-panel-foot {
  padding: 7px 12px 9px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
  line-height: 15px;
}
.mb-kbd {
  padding: 0 4px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-bottom-width: 1.5px;
  border-radius: 4px;
  font-size: 10px;
}

.mb-toast {
  position: fixed;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: min(560px, calc(100vw - 32px));
  padding: 10px 14px;
  border: 0;
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-toast-bg);
  color: var(--dsw-alias-toast-label);
  font-size: 13px;
  line-height: 20px;
  box-shadow: var(--dsw-shadow-lv3);
}
.mb-toast button {
  border: 0;
  background: none;
  color: var(--dsw-static-deepseek-400);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.mb-flash {
  animation: mb-flash 1.2s ease-out 1;
  border-radius: 12px;
}
@keyframes mb-flash {
  0% { box-shadow: 0 0 0 2px var(--dsw-alias-state-business-primary); background: var(--dsw-alias-state-business-tertiary); }
  100% { box-shadow: 0 0 0 2px transparent; background: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .mb-flash { animation: none; outline: 2px solid var(--dsw-alias-state-business-primary); }
}
`

/**
 * Install the stylesheet once.
 * @returns disposer that removes the tag; a hot reload may call install again
 * before the previous disposer runs, so installation is idempotent by id.
 */
export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.getElementById(STYLE_ID)
  if (existing !== null) {
    existing.textContent = CSS
    return () => { existing.remove() }
  }
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.dataset.plugin = 'dsh-markboard'
  tag.textContent = CSS
  document.head.append(tag)
  return () => {
    if (tag.isConnected) tag.remove()
  }
}
