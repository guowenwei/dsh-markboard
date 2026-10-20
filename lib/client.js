window.__ModuleLoader__.load({ id: "dsh-markboard", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/MarkAction.tsx
var import_react = require("react");

// src/client/icons.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var ICON_BOOKMARK = "M4.5 3.5h7a1 1 0 0 1 1 1v9.2l-4.5-2.7-4.5 2.7V4.5a1 1 0 0 1 1-1Z";
var ICON_SEARCH = "M7.2 11.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm3.1-.3 2.9 2.9";
var ICON_CLOSE = "m4.5 4.5 7 7m0-7-7 7";
var ICON_ARROW = "M4 8h8m-3-3 3 3-3 3";
var ICON_FILL = "M8 3.5v6m-2.4-2.4L8 9.5l2.4-2.4M4 12.5h8";
function Icon({ path, filled = false, size = 14, title }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": title === void 0 ? true : void 0,
      role: title === void 0 ? void 0 : "img",
      focusable: "false",
      children: [
        title === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: path })
      ]
    }
  );
}

// src/client/MarkAction.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var MarkAction = (0, import_react.memo)(function MarkAction2({ turn: location, seq, sessionId, board, useChat, t }) {
  const turn = location.turn;
  const marked = useMarkFor(turn, sessionId, board);
  const nodes = useChat((snapshot) => snapshot.nodes);
  const onClick = (0, import_react.useCallback)(() => {
    if (marked !== void 0) {
      board.unmark(marked.id);
      return;
    }
    board.mark(board.capture(nodes, turn, seq, sessionId));
  }, [board, marked, nodes, seq, sessionId, turn]);
  const label = marked === void 0 ? t("action.mark") : t("action.unmark");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      className: "mb-mark-action",
      "data-marked": marked === void 0 ? void 0 : "",
      "aria-pressed": marked !== void 0,
      "aria-label": label,
      title: label,
      onClick,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { path: ICON_BOOKMARK, filled: marked !== void 0 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: marked === void 0 ? t("action.mark") : t("action.marked") })
      ]
    }
  );
});
function useMarkFor(turn, sessionId, board) {
  const marks = useMarks(board);
  return marks.find((mark) => mark.sessionId === sessionId && mark.turn === turn);
}
function useMarks(board) {
  const [snapshot, setSnapshot] = (0, import_react.useState)(() => board.marks.getSnapshot());
  (0, import_react.useEffect)(() => {
    setSnapshot(board.marks.getSnapshot());
    return board.marks.subscribe(() => {
      setSnapshot(board.marks.getSnapshot());
    });
  }, [board]);
  return snapshot;
}

// src/client/HeaderAction.tsx
var import_react2 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var HeaderAction = (0, import_react2.memo)(function HeaderAction2({ sessionId, board, t }) {
  const marks = useMarks(board);
  const count = marks.filter((mark) => mark.sessionId === sessionId).length;
  const open = (0, import_react2.useCallback)(() => {
    board.openPanel();
  }, [board]);
  if (count === 0) return null;
  const label = t("header.count", { count });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "button",
    {
      type: "button",
      className: "mb-header-action",
      "aria-label": `${label} \xB7 ${t("header.open")}`,
      title: t("header.open"),
      "data-dsh-markboard-entry": "",
      onClick: open,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { path: ICON_BOOKMARK, filled: true }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mb-header-count", children: count })
      ]
    }
  );
});

// src/client/MarkboardBody.tsx
var import_react3 = require("react");

// src/shared/marks.ts
var STORAGE_KEY = "dsh-markboard.v1";
var LIMITS = {
  /** Characters of the user's prompt retained for the card preview. */
  prompt: 400,
  /** Characters of the Turn's answer retained for the card preview and the composer fill. */
  response: 2400,
  /** Characters of the user-editable task label. */
  label: 60,
  /** Total marks retained; oldest marks beyond this are dropped on write. */
  marks: 500
};
function collapse(text) {
  return text.replace(/\s+/gu, " ").trim();
}
function clip(text, max) {
  const collapsed = collapse(text);
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, Math.max(0, max - 1))}\u2026`;
}
function defaultLabel(prompt) {
  const collapsed = collapse(prompt);
  if (collapsed === "") return "";
  const sentence = /^(.+?[。！？!?.;；])/u.exec(collapsed)?.[1] ?? collapsed;
  return clip(sentence, LIMITS.label);
}
function sameTarget(left, right) {
  return left.sessionId === right.sessionId && left.turn === right.turn;
}
function normalize(input, id) {
  const prompt = clip(input.prompt, LIMITS.prompt);
  return {
    id,
    sessionId: input.sessionId,
    sessionTitle: clip(input.sessionTitle, 120),
    turn: input.turn,
    seq: input.seq,
    prompt,
    response: clip(input.response, LIMITS.response),
    label: clip(input.label ?? defaultLabel(prompt), LIMITS.label),
    createdAt: input.createdAt ?? Date.now()
  };
}
function put(marks, mark) {
  const existing = marks.findIndex((candidate) => sameTarget(candidate, mark));
  const without = existing === -1 ? [...marks] : [...marks.slice(0, existing), ...marks.slice(existing + 1)];
  const previous = existing === -1 ? void 0 : marks[existing];
  const effective = previous === void 0 ? mark : { ...mark, id: previous.id, createdAt: previous.createdAt };
  const next = [effective, ...without].slice(0, LIMITS.marks);
  return { marks: next, mark: effective };
}
function remove(marks, id) {
  return marks.filter((mark) => mark.id !== id);
}
function rename(marks, id, label) {
  const next = clip(label, LIMITS.label);
  return marks.map((mark) => mark.id === id ? { ...mark, label: next === "" ? defaultLabel(mark.prompt) : next } : mark);
}
function forSession(marks, sessionId) {
  return sessionId === void 0 ? [] : marks.filter((mark) => mark.sessionId === sessionId);
}
function matches(mark, query) {
  const needle = collapse(query).toLowerCase();
  if (needle === "") return true;
  const haystack = [mark.label, mark.prompt, mark.response, mark.sessionTitle, String(mark.turn)].join("\n").toLowerCase();
  return haystack.includes(needle);
}
function select(marks, scope, sessionId, query) {
  const scoped = scope === "all" ? [...marks] : forSession(marks, sessionId);
  return query === "" ? scoped : scoped.filter((mark) => matches(mark, query));
}
function draftText(mark, turnLabel) {
  const title = mark.sessionTitle === "" ? mark.sessionId : mark.sessionTitle;
  const body = collapse(mark.response === "" ? mark.prompt : mark.response);
  return `> \u6807\u8BB0 \xB7 ${title} \xB7 ${turnLabel}
> ${body}

`;
}
function parse(raw) {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.marks)) return [];
  const marks = [];
  for (const entry of raw.marks) {
    if (!isRecord(entry)) continue;
    const { id, sessionId, sessionTitle, turn, seq, prompt, response, label, createdAt } = entry;
    if (typeof id !== "string" || id === "") continue;
    if (typeof sessionId !== "string" || sessionId === "") continue;
    if (!isInteger(turn) || !isInteger(seq) || !isInteger(createdAt)) continue;
    if (typeof prompt !== "string" || typeof response !== "string") continue;
    marks.push({
      id,
      sessionId,
      sessionTitle: typeof sessionTitle === "string" ? sessionTitle : "",
      turn,
      seq,
      prompt,
      response,
      label: typeof label === "string" && label !== "" ? label : defaultLabel(prompt),
      createdAt
    });
  }
  return marks.sort((left, right) => right.createdAt - left.createdAt).slice(0, LIMITS.marks);
}
function serialize(marks) {
  return JSON.stringify({ version: 1, marks });
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

// src/client/MarkboardBody.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var MarkboardBody = (0, import_react3.memo)(function MarkboardBody2({ sessionId, board, t }) {
  const marks = useMarks(board);
  const shortcut = useShortcut(board);
  const [scope, setScope] = (0, import_react3.useState)("session");
  const [query, setQuery] = (0, import_react3.useState)("");
  const [editing, setEditing] = (0, import_react3.useState)(void 0);
  const sessionCount = (0, import_react3.useMemo)(
    () => marks.filter((mark) => mark.sessionId === sessionId).length,
    [marks, sessionId]
  );
  const rows = (0, import_react3.useMemo)(() => select(marks, scope, sessionId, query), [marks, scope, sessionId, query]);
  const allCount = marks.length;
  const inAllScope = scope === "all";
  const commitRename = (0, import_react3.useCallback)(() => {
    if (editing === void 0) return;
    board.relabel(editing.id, editing.value);
    setEditing(void 0);
  }, [board, editing]);
  const onRenameKey = (0, import_react3.useCallback)((event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      commitRename();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(void 0);
    }
  }, [commitRename]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-panel", "data-dsh-markboard-panel": "", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-panel-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-panel-title", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("panel.title") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-count", children: allCount }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-grow" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "mb-search", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { path: ICON_SEARCH, size: 13 }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "search",
            value: query,
            placeholder: t("panel.search"),
            "aria-label": t("panel.search"),
            onChange: (event) => {
              setQuery(event.target.value);
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            className: "mb-chip",
            "data-on": scope === "session" ? "" : void 0,
            "aria-pressed": scope === "session",
            onClick: () => {
              setScope("session");
            },
            children: t("panel.scope.session", { count: sessionCount })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            className: "mb-chip",
            "data-on": inAllScope ? "" : void 0,
            "aria-pressed": inAllScope,
            onClick: () => {
              setScope("all");
            },
            children: t("panel.scope.all", { count: allCount })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "mb-list", children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "mb-empty", children: emptyCopy(marks.length, sessionId, query, scope, t) }) : rows.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "mb-card", "data-dsh-markboard-card": "", "data-mark-id": mark.id, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-card-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-turn", children: t("panel.turn", { turn: mark.turn }) }),
        editing?.id === mark.id ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            autoFocus: true,
            value: editing.value,
            maxLength: 60,
            "aria-label": t("dialog.label"),
            className: "mb-rename",
            onChange: (event) => {
              setEditing({ id: mark.id, value: event.target.value });
            },
            onKeyDown: onRenameKey,
            onBlur: commitRename
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            className: "mb-card-label",
            title: t("action.rename"),
            onClick: () => {
              setEditing({ id: mark.id, value: mark.label });
            },
            children: mark.label === "" ? t("panel.turn", { turn: mark.turn }) : mark.label
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-when", children: whenLabel(mark.createdAt, t) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "mb-preview", children: mark.response === "" ? mark.prompt : mark.response }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mb-card-foot", children: [
        inAllScope ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-badge", title: mark.sessionTitle, children: mark.sessionTitle === "" ? mark.sessionId : mark.sessionTitle }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "mb-grow" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "mb-btn", "data-primary": "", onClick: () => {
          board.jump(mark);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { path: ICON_ARROW, size: 12 }),
          t("action.jump")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "mb-btn", onClick: () => {
          board.fill(mark);
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { path: ICON_FILL, size: 12 }),
          t("action.fill")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "button",
          {
            type: "button",
            className: "mb-btn",
            "data-danger": "",
            "aria-label": t("action.delete"),
            title: t("action.delete"),
            onClick: () => {
              board.remove(mark.id);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { path: ICON_CLOSE, size: 12 }),
              t("action.delete")
            ]
          }
        )
      ] })
    ] }, mark.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "mb-panel-foot", children: t("panel.localOnly", { shortcut: shortcut === "" ? "\u2014" : shortcut }) })
  ] });
});
var MarkboardTitle = (0, import_react3.memo)(function MarkboardTitle2({ t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("panel.title") });
});
function emptyCopy(total, sessionId, query, scope, t) {
  if (sessionId === "") return t("panel.noSession");
  if (query !== "") return t("panel.emptySearch");
  if (scope === "all" || total === 0) return t("panel.empty");
  return t("panel.emptySession");
}
function whenLabel(createdAt, t) {
  const now = Date.now();
  const then = new Date(createdAt);
  const elapsed = now - createdAt;
  const minute = 6e4;
  const hour = 60 * minute;
  if (elapsed < minute) return t("time.now");
  if (elapsed < hour) return t("time.minutes", { count: Math.floor(elapsed / minute) });
  if (new Date(now).toDateString() === then.toDateString()) {
    return then.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" });
  }
  if (elapsed < 7 * 24 * hour) return then.toLocaleDateString(void 0, { weekday: "short" });
  return then.toLocaleDateString(void 0, { month: "2-digit", day: "2-digit" });
}
function useShortcut(board) {
  const [label, setLabel] = (0, import_react3.useState)(() => board.shortcut.getSnapshot());
  (0, import_react3.useEffect)(() => {
    setLabel(board.shortcut.getSnapshot());
    return board.shortcut.subscribe(() => {
      setLabel(board.shortcut.getSnapshot());
    });
  }, [board]);
  return label;
}

// src/client/Toast.tsx
var import_react4 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var HOLD_MS = 4e3;
var MarkboardToast = (0, import_react4.memo)(function MarkboardToast2({ board }) {
  const toast = useToast(board);
  (0, import_react4.useEffect)(() => {
    if (toast === void 0) return;
    const timer = window.setTimeout(() => {
      board.dismissToast();
    }, HOLD_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [board, toast]);
  if (toast === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mb-toast", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: toast.text }),
    toast.action === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          toast.action?.run();
          board.dismissToast();
        },
        children: toast.action.label
      }
    )
  ] });
});
function useToast(board) {
  const [toast, setToast] = (0, import_react4.useState)(() => board.toast.getSnapshot());
  (0, import_react4.useEffect)(() => {
    setToast(board.toast.getSnapshot());
    return board.toast.subscribe(() => {
      setToast(board.toast.getSnapshot());
    });
  }, [board]);
  return toast;
}

// src/client/styles.ts
var STYLE_ID = "dsh-markboard/styles";
var CSS = `
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
`;
function installStyles() {
  if (typeof document === "undefined") return () => {
  };
  const existing = document.getElementById(STYLE_ID);
  if (existing !== null) {
    existing.textContent = CSS;
    return () => {
      existing.remove();
    };
  }
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.dataset.plugin = "dsh-markboard";
  tag.textContent = CSS;
  document.head.append(tag);
  return () => {
    if (tag.isConnected) tag.remove();
  };
}

// src/client/kind.ts
var TAB_KIND = "markboard";
var TAB_ID = "dsh-markboard";
var NS = "markboard";
var SHORTCUT_ID = "markboard.open";

// src/client/surface.ts
var MarkboardSurfaceImpl = class {
  /**
   * @param ctx - client root context.
   * @param board - live mark store.
   * @param t - markboard translator.
   */
  constructor(ctx, board, t) {
    this.ctx = ctx;
    this.board = board;
    this.t = t;
    this.marks = {
      getSnapshot: () => board.getSnapshot(),
      subscribe: board.subscribe.bind(board)
    };
    this.toast = {
      getSnapshot: () => this.toastState,
      subscribe: (listener) => {
        this.toastListeners.add(listener);
        return () => {
          this.toastListeners.delete(listener);
        };
      }
    };
    this.shortcut = {
      getSnapshot: () => this.shortcutLabel,
      subscribe: (listener) => {
        this.shortcutListeners.add(listener);
        return () => {
          this.shortcutListeners.delete(listener);
        };
      }
    };
    this.offShortcut = this.watchShortcut();
  }
  marks;
  toast;
  shortcut;
  toastSeq = 0;
  toastState;
  toastListeners = /* @__PURE__ */ new Set();
  shortcutListeners = /* @__PURE__ */ new Set();
  shortcutLabel = "";
  offShortcut;
  t;
  /** Release the shortcut catalog subscription. */
  dispose() {
    this.offShortcut();
  }
  watchShortcut() {
    const shortcuts = this.ctx.get("shortcuts");
    const catalog = shortcuts?.catalog;
    if (catalog === void 0) return () => {
    };
    const sync = () => {
      const entry = catalog.getSnapshot().find((candidate) => candidate.id === "markboard.open");
      const next = entry === void 0 ? "" : entry.keys.join("+");
      if (next === this.shortcutLabel) return;
      this.shortcutLabel = next;
      for (const listener of [...this.shortcutListeners]) listener();
    };
    sync();
    return catalog.subscribe(sync);
  }
  capture(source, turn, seq, sessionId) {
    const prompt = source.turnDataSource(turn, "user").getSnapshot().map((data) => textOfContent(data.content)).join("\n");
    const response = source.turnDataSource(turn, "assistant-step").getSnapshot().map((data) => (data.blocks ?? []).filter((block) => block.kind === "text").map((block) => block.text ?? "").join("")).join("\n");
    return { sessionId, sessionTitle: this.titleOf(sessionId), turn, seq, prompt, response };
  }
  titleOf(sessionId) {
    const row = this.ctx.sessions.list.getSnapshot().byId[sessionId];
    return row?.displayTitle ?? "";
  }
  markFor(sessionId, turn) {
    return this.board.getSnapshot().find((mark) => mark.sessionId === sessionId && mark.turn === turn);
  }
  mark(facts, label) {
    const result = this.board.mark({
      sessionId: facts.sessionId,
      sessionTitle: facts.sessionTitle,
      turn: facts.turn,
      seq: facts.seq,
      prompt: facts.prompt,
      response: facts.response,
      ...label === void 0 || label === "" ? {} : { label }
    }, crypto.randomUUID());
    if (!result.ok) {
      this.notify(this.t("panel.storageFailed"));
      return false;
    }
    const mark = result.mark;
    this.notify(this.t("toast.marked", { label: mark.label === "" ? defaultLabel(mark.prompt) : mark.label }), {
      label: this.t("action.undo"),
      run: () => {
        this.board.unmark(mark.id);
      }
    });
    return true;
  }
  unmark(id) {
    this.board.unmark(id);
    this.notify(this.t("toast.unmarked"));
  }
  relabel(id, label) {
    if (!this.board.relabel(id, label).ok) this.notify(this.t("panel.storageFailed"));
  }
  remove(id) {
    const before = [...this.board.getSnapshot()];
    if (!before.some((mark) => mark.id === id)) return;
    this.board.unmark(id);
    this.notify(this.t("toast.deleted"), {
      label: this.t("action.undo"),
      run: () => {
        this.board.restore(before);
      }
    });
  }
  notify(text, action) {
    this.toastSeq += 1;
    this.toastState = { id: this.toastSeq, text, ...action === void 0 ? {} : { action } };
    for (const listener of [...this.toastListeners]) listener();
  }
  dismissToast() {
    if (this.toastState === void 0) return;
    this.toastState = void 0;
    for (const listener of [...this.toastListeners]) listener();
  }
  openPanel() {
    if (this.ctx.sidebarRight.mounted.getSnapshot() === void 0) {
      this.notify(this.t("panel.noSession"));
      return;
    }
    try {
      this.ctx.sidebarRight.openTab(TAB_KIND);
    } catch (error) {
      console.error("[dsh-markboard] could not open the panel:", error);
      this.notify(this.t("panel.noSession"));
    }
  }
  jump(mark) {
    const run = async () => {
      if (this.ctx.sidebarRight.mounted.getSnapshot() !== mark.sessionId) {
        this.ctx.uiWorkspace.openSession(mark.sessionId);
      }
      const row = await this.locate(mark);
      if (row === void 0) {
        this.notify(this.t("toast.jumpFailed"));
        return;
      }
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      row.classList.add("mb-flash");
      window.setTimeout(() => {
        row.classList.remove("mb-flash");
      }, 1400);
    };
    void run();
  }
  /**
   * Find the Turn's row, paging its history in when the window lacks it.
   * @param mark - the mark whose Turn to find.
   * @returns the row element, or `undefined` when it never materialized.
   */
  async locate(mark) {
    const first = this.rowOf(mark);
    if (first !== void 0) return first;
    await this.pageTo(mark);
    for (let attempt = 0; attempt < 24; attempt++) {
      await delay(attempt === 0 ? 60 : 250);
      const row = this.rowOf(mark);
      if (row !== void 0) return row;
    }
    return void 0;
  }
  rowOf(mark) {
    const scope = document.querySelector(`[data-conversation-session="${mark.sessionId}"]`);
    const root = scope ?? document;
    return root.querySelector(`[data-chat-turn="${mark.turn}"]`) ?? void 0;
  }
  async pageTo(mark) {
    try {
      const binding = this.ctx.sessions.binding(mark.sessionId);
      if (binding === void 0) return;
      await binding.session.loadThrough(mark.seq);
    } catch (error) {
      console.error("[dsh-markboard] history paging failed:", error);
    }
  }
  fill(mark) {
    const text = draftText(mark, this.t("panel.turn", { turn: mark.turn }));
    const run = async () => {
      if (this.ctx.sidebarRight.mounted.getSnapshot() !== mark.sessionId) {
        this.ctx.uiWorkspace.openSession(mark.sessionId);
        await delay(150);
      }
      const binding = this.ctx.sessions.binding(mark.sessionId);
      if (binding === void 0) {
        this.notify(this.t("toast.fillFailed"));
        return;
      }
      const previous = this.draftOf(mark.sessionId);
      const result = this.ctx.conversation.input.requestDraftInitialization(binding, {
        prompt: text,
        clearPreviousDraft: true
      });
      if (result === "blocked") {
        this.notify(this.t("toast.fillFailed"));
        return;
      }
      this.notify(this.t("toast.filled"), previous === void 0 || previous === "" ? void 0 : {
        label: this.t("action.undo"),
        run: () => {
          this.ctx.conversation.input.requestDraftInitialization(binding, {
            prompt: previous,
            clearPreviousDraft: true
          });
          this.dismissToast();
        }
      });
    };
    void run();
  }
  /** The Session's draft before this fill, read from the input facade the shell owns. */
  draftOf(sessionId) {
    try {
      const binding = this.ctx.sessions.binding(sessionId);
      if (binding === void 0) return void 0;
      return this.ctx.conversation.input.for(binding.ctx).state.getSnapshot().draft;
    } catch {
      return void 0;
    }
  }
};
function textOfContent(content) {
  if (content === void 0) return "";
  const parts = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const record = block;
    if (record.type === "text" && typeof record.text === "string") parts.push(record.text);
  }
  return parts.join("\n");
}
function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// src/shared/locales.ts
var zh = {
  "action.mark": "\u6807\u8BB0",
  "action.marked": "\u5DF2\u6807\u8BB0",
  "action.unmark": "\u53D6\u6D88\u6807\u8BB0",
  "action.save": "\u4FDD\u5B58",
  "action.cancel": "\u53D6\u6D88",
  "action.undo": "\u64A4\u9500",
  "action.jump": "\u8DF3\u8F6C",
  "action.fill": "\u586B\u5165\u8F93\u5165\u6846",
  "action.rename": "\u91CD\u547D\u540D",
  "action.delete": "\u5220\u9664",
  "action.new": "\u65B0\u5EFA",
  "header.count": "\u6807\u8BB0 {count}",
  "header.open": "\u6253\u5F00\u6807\u8BB0\u677F",
  "panel.title": "\u6807\u8BB0",
  "panel.scope.session": "\u672C\u4F1A\u8BDD {count}",
  "panel.scope.all": "\u5168\u90E8\u4F1A\u8BDD {count}",
  "panel.search": "\u641C\u7D22\u6807\u9898\u3001\u5185\u5BB9\u6216\u8F6E\u6B21",
  "panel.empty": "\u8FD8\u6CA1\u6709\u6807\u8BB0\u3002\u5728\u4EFB\u610F\u4E00\u8F6E\u56DE\u7B54\u4E0B\u65B9\u70B9\u300C\u6807\u8BB0\u300D\uFF0C\u5B83\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002",
  "panel.emptySearch": "\u6CA1\u6709\u5339\u914D\u7684\u6807\u8BB0",
  "panel.emptySession": "\u672C\u4F1A\u8BDD\u8FD8\u6CA1\u6709\u6807\u8BB0",
  "panel.noSession": "\u5148\u6253\u5F00\u4E00\u4E2A\u4F1A\u8BDD",
  "panel.storageFailed": "\u6807\u8BB0\u65E0\u6CD5\u4FDD\u5B58\uFF1A\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\u6216\u5DF2\u6EE1",
  "panel.localOnly": "\u6807\u8BB0\u4FDD\u5B58\u5728\u672C\u673A \xB7 {shortcut} \u6253\u5F00",
  "panel.turn": "\u7B2C {turn} \u8F6E",
  "time.now": "\u521A\u521A",
  "time.minutes": "{count} \u5206\u949F\u524D",
  "dialog.label": "\u4EFB\u52A1\u540D",
  "dialog.placeholder": "\u7ED9\u8FD9\u4E00\u8F6E\u8D77\u4E2A\u540D\u5B57",
  "toast.marked": "\u5DF2\u6807\u8BB0 \xB7 {label}",
  "toast.unmarked": "\u5DF2\u53D6\u6D88\u6807\u8BB0",
  "toast.filled": "\u5DF2\u586B\u5165\u8F93\u5165\u6846 \xB7 \u53EF\u7EE7\u7EED\u7F16\u8F91",
  "toast.fillFailed": "\u5F53\u524D\u4F1A\u8BDD\u4E0D\u53EF\u8F93\u5165\uFF0C\u7A0D\u540E\u91CD\u8BD5",
  "toast.jumpFailed": "\u8FD9\u4E00\u8F6E\u8FD8\u6CA1\u8F7D\u5165\uFF0C\u8BF7\u5148\u5728\u4F1A\u8BDD\u4E2D\u5411\u4E0A\u52A0\u8F7D\u66F4\u65E9\u5386\u53F2",
  "toast.deleted": "\u5DF2\u5220\u9664\u6807\u8BB0"
};
var en = {
  "action.mark": "Mark",
  "action.marked": "Marked",
  "action.unmark": "Remove mark",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.undo": "Undo",
  "action.jump": "Jump",
  "action.fill": "Fill composer",
  "action.rename": "Rename",
  "action.delete": "Delete",
  "action.new": "New",
  "header.count": "Marks {count}",
  "header.open": "Open the markboard",
  "panel.title": "Marks",
  "panel.scope.session": "This session {count}",
  "panel.scope.all": "All sessions {count}",
  "panel.search": "Search label, content, or turn",
  "panel.empty": "No marks yet. Use \u201CMark\u201D under any answer and it shows up here.",
  "panel.emptySearch": "No marks match",
  "panel.emptySession": "No marks in this session yet",
  "panel.noSession": "Open a session first",
  "panel.storageFailed": "Marks cannot be saved: browser storage is unavailable or full",
  "panel.localOnly": "Marks stay on this device \xB7 {shortcut} to open",
  "panel.turn": "Turn {turn}",
  "time.now": "Just now",
  "time.minutes": "{count} min ago",
  "dialog.label": "Task name",
  "dialog.placeholder": "Name this turn",
  "toast.marked": "Marked \xB7 {label}",
  "toast.unmarked": "Mark removed",
  "toast.filled": "Filled the composer \xB7 keep editing",
  "toast.fillFailed": "This session is not accepting input right now",
  "toast.jumpFailed": "That turn is not loaded yet; scroll up to load older history first",
  "toast.deleted": "Mark deleted"
};

// src/shared/store.ts
function read() {
  const storage = safeStorage();
  if (storage === void 0) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? [] : parse(JSON.parse(raw));
  } catch {
    return [];
  }
}
function safeStorage() {
  try {
    return typeof localStorage === "undefined" ? void 0 : localStorage;
  } catch {
    return void 0;
  }
}
function write(storage, marks) {
  try {
    storage.setItem(STORAGE_KEY, serialize(marks));
    return true;
  } catch {
    return false;
  }
}
function createMarkboard(idFactory) {
  let marks = read();
  const listeners = /* @__PURE__ */ new Set();
  const notify = () => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        console.error("[dsh-markboard] subscriber failed:", error);
      }
    }
  };
  const publish = (next) => {
    const storage = safeStorage();
    if (storage === void 0) {
      marks = next;
      notify();
      return { ok: false, reason: "storage" };
    }
    if (!write(storage, next)) return { ok: false, reason: "storage" };
    marks = next;
    notify();
    return { ok: true };
  };
  return {
    getSnapshot: () => marks,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mark(input, id) {
      const { marks: next, mark } = put(marks, normalize(input, id));
      const result = publish(next);
      return result.ok ? { ok: true, mark } : { ok: false, reason: "storage" };
    },
    unmark: (id) => publish(remove(marks, id)),
    relabel: (id, label) => publish(rename(marks, id, label)),
    restore: (next) => publish([...next]),
    refresh() {
      marks = read();
      notify();
    }
  };
}

// src/client/index.ts
var inject = [
  "slots",
  "locale",
  "sidebarRight",
  "sidebarRightTabs",
  "shortcuts",
  "uiWorkspace",
  "sessions",
  "conversation"
];
function apply(ctx) {
  try {
    mount(ctx);
  } catch (error) {
    console.error("[dsh-markboard] activation failed:", error);
    throw error;
  }
}
function mount(ctx) {
  ctx.effect(() => installStyles(), "markboard: styles");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "markboard: dictionaries");
  const board = createMarkboard(() => crypto.randomUUID());
  ctx.effect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      board.refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, "markboard: cross-tab storage");
  const surface = new MarkboardSurfaceImpl(ctx, board, ctx.locale.bind(NS));
  ctx.effect(() => () => {
    surface.dispose();
  }, "markboard: surface");
  ctx.provide("markboard", surface);
  ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
    name: "conversation.chat.turnTail",
    id: "markboard",
    order: 60,
    locale: NS,
    inject: () => ({ board: surface })
  }, MarkAction));
  ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
    name: "conversation.session.header.utilities",
    id: "markboard",
    order: 40,
    locale: NS,
    inject: () => ({ board: surface })
  }, HeaderAction));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "markboard-toast",
    order: 70,
    locale: NS,
    inject: () => ({ board: surface })
  }, MarkboardToast));
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => ctx.locale.bind(NS)("panel.title"),
    guide: [{
      id: "markboard",
      order: 30,
      title: () => ctx.locale.bind(NS)("panel.title"),
      description: () => ctx.locale.bind(NS)("panel.empty")
    }]
  }), "markboard: tab type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: TAB_ID,
    locale: NS,
    inject: () => ({ board: surface })
  }, MarkboardBody)), "markboard: tab body");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab.title", () => ctx.slots.register({
    name: "sidebar.right.pane.tab.title",
    key: TAB_ID,
    locale: NS,
    inject: () => ({ board: surface })
  }, MarkboardTitle)), "markboard: tab title");
  ctx.effect(() => ctx.shortcuts.register({
    id: SHORTCUT_ID,
    label: () => ctx.locale.bind(NS)("panel.title"),
    aliases: ["marks", "markboard", "\u6807\u8BB0", "\u6807\u8BB0\u677F"],
    // Web input only accepts two-modifier combinations that include the platform
    // primary (and Linux accepts a fixed short list), so the browser profiles are
    // named explicitly and the Linux web profile is left unbound rather than
    // registering a default the registry would reject.
    defaults: {
      "web:windows": { code: "KeyM", modifiers: ["primary", "alt"] },
      "web:macos": { code: "KeyM", modifiers: ["primary", "alt"] },
      "desktop:windows": { code: "KeyM", modifiers: ["primary", "alt"] },
      "desktop:macos": { code: "KeyM", modifiers: ["primary", "alt"] },
      "desktop:linux": { code: "KeyM", modifiers: ["primary", "alt"] }
    },
    regions: ["page", "editable", "terminal"],
    modals: [],
    resolve: ({ target }) => {
      const command = ctx.sidebarRight.commandTarget(target);
      if (command === void 0) {
        return { status: "blocked", reason: ctx.locale.bind(NS)("panel.noSession") };
      }
      return { status: "handled", run: () => {
        ctx.sidebarRight.openTabFromTarget(TAB_KIND, command);
      } };
    }
  }), "markboard: open shortcut");
}
return module.exports; } });
//# sourceMappingURL=client.js.map
