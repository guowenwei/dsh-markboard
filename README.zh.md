# dsh-markboard · 会话标记板

[English](./README.md) | 中文

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的 Web 界面加一块**会话标记板**：把任意一轮对话标记成一张任务卡，命名它、随时跳回原处，或者一键把结论填进输入框接着聊。标记保存在本机浏览器里。

> 你用不着再一页页翻历史去找「上次那个结论」。标一次，以后只在这几行里挑。

## 截图

| 每轮操作行的「标记」按钮 + 头部计数 | 右侧栏标记板 |
|---|---|
| ![标记](docs/e2e/02-marked.png) | ![面板](docs/e2e/03-panel.png) |

| 一键填入输入框 | 跳回原轮次 |
|---|---|
| ![填入](docs/e2e/04-filled.png) | ![跳转](docs/e2e/05-jump.png) |

## 功能

- **按「轮」标记**：每轮已完成的回答下方新增一个「标记」按钮，点击即记下这一轮（你的提问 + 这轮结论），并自动用提问首句命名。再点一次取消。
- **会话头部计数**：头部右侧显示当前会话的标记数，点它打开标记板。
- **右侧栏标记板**：与「文件」「浏览器」并列的一个 Tab，可按「本会话 / 全部会话」切换、按标题 / 内容 / 轮次搜索。
- **重命名与删除**：点卡片标题就地改名；删除带撤销。
- **跳回原处**：跨会话打开并滚动到目标轮次；该轮不在已加载窗口里时，先按 `seq` 精确补载历史（`loadThrough`），落点高亮闪一次。
- **填入输入框**：把该轮结论作为纯文本引用写进**当前**草稿（`> 标记 · 会话 · 第 N 轮`），可继续编辑或整段删除；填入后可撤销回原草稿。面板里其他会话的卡片也填到当前输入框、不切会话（原草稿已有内容时追加在后面，不会覆盖）。
- **跨标签页同步**：另一个同源标签页改了标记，当前页会跟随更新。
- **中英双语**，跟随界面语言。

## 安装

```sh
dsh plugin --profile web add dsh-markboard
```

然后重启 `dsh web`。插件会自动加入 profile 的 bundle 层，无需其它配置。

本地开发目录安装：

```sh
dsh plugin --profile web add file:/absolute/path/to/dsh-markboard
```

## 使用

1. 在会话里找到你想记住的那一轮，回答下方的操作行点「标记」。
2. 会话头部出现计数；点它（或按 `Ctrl+Alt+M`）打开右侧标记板。
3. 卡片上三个动作：**跳转**（回到原轮次）、**填入输入框**（把结论作为引用写进草稿）、**删除**（可撤销）。
4. 点卡片标题可以改名——名字就是你的任务名。

## 快捷键

`Ctrl+Alt+M`（macOS 上为 `⌘+Alt+M`）开关标记板。可在「设置 → 快捷键」里改。

## 原理

插件包含两个半边：

- **宿主半边**（`lib/index.js`）：空 `apply`。它只让这个包成为一条普通 Loader 条目，从而让 `package.json` 里的 `dsh.client` 声明能被 `client-modules` 扫描到，浏览器半边才会被装进 `window.__DSH_BOOT__`。
- **浏览器半边**（`src/client`，构建为 `lib/client.js`）：注册三个既有扩展位，并提供一个 `ctx.markboard` 服务。

| 位置 | 扩展位 | 作用 |
|---|---|---|
| 每轮操作行 | `conversation.chat.turnTail` | 「标记 / 已标记」按钮 |
| 会话头部 | `conversation.session.header.utilities` | 标记计数入口 |
| 右侧栏 | `ctx.sidebarRightTabs` + `sidebar.right.pane.tab` | 标记板页面 |
| 提示 | `shell.overlay` | 「已标记 / 已填入 / 删除」提示与撤销 |

数据模型是纯函数（`src/shared/marks.ts`），`sessionId + turn` 是身份：同一轮重复标记只会改那一张卡，不会产生两条。持久化在 `localStorage['dsh-markboard.v1']`，写入失败（配额、隐私模式）只提示、不抛错，内存里的列表仍然可用。

**为什么不用宿主存储**：个人标记板不需要跨设备同步；localStorage 的代价只是换浏览器或换端口会丢，界面里已写明「标记保存在本机」。

**为什么回填是纯文本**：`insertText` / `setDraft` 是内核的公开动作面；做成富文本 chip 需要内核支持引用片段，属于另一个量级的改动，也会随内核升级漂移。

## 开发

```sh
npm install     # 只为 esbuild（构建期依赖）
npm run build   # src/client → lib/client.js（包成 window.__ModuleLoader__.load 形式）
npm test        # 数据模型与持久化规则（Node 原生 test runner）
```

端到端（**会打开真实浏览器窗口**，方便肉眼看流程）：

```sh
# 1. 用一个隔离的 DSH home 起实例，避免动到你日常的会话
$env:DSH_HOME='D:\dsh-e2e\home'
dsh --profile e2e --port 3099 --no-open

# 2. 另开一个终端，把打印出来的带 token URL 交给脚本
node tests/e2e-headed.mjs --url "http://127.0.0.1:3099/?token=…" --slow 700
```

脚本会依次演示：打开会话 → 标记 → 打开面板 → 改名 → 填入输入框 → 跳转回原轮次 → 刷新验证 → 搜索 → 删除并撤销，并把每一步截图写到 `docs/e2e/`。加 `--headless` 可无窗口运行。

## 已知限制

- **只标记整轮**，不支持单独标记某条消息或划词片段；粒度小到一句时，卡片列表会迅速失去可读性。
- **标记只在本机浏览器**：不跨浏览器、不跨端口（origin 变了 localStorage 就换了），也没有导出。
- **跳转依赖该轮的 DOM 行**：如果目标轮次在窗口最前面且历史仍在加载，会先触发一次精确补载；补载失败时给出提示而不是静默失败。
- **填入走纯文本引用**，不会把原消息里的附件或图片一起带过去。
- **面板按会话绑定**：切会话时面板跟随；「全部会话」只是同一页里的一个视图。

## License

[MIT](./LICENSE)
