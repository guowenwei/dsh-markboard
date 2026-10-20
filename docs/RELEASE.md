# 发布清单 · dsh-markboard

插件本体已完成、已测试、已上 GitHub。剩下的两步都需要**你的账号权限**，我无法代跑。

## 现状

| 项目 | 状态 |
|---|---|
| 源码 / 构建 / 单测（15 项） | ✅ 完成 |
| 真浏览器端到端（18 项断言，含 tarball 安装验证） | ✅ 全绿 |
| GitHub 仓库 `guowenwei/dsh-markboard` | ✅ 已推送（`main`，`0b47afc`） |
| `v0.1.0` Release + 预构建 tarball | ✅ 已上传 |
| npm 发布 | ⛔ 等你执行 |
| dshopen.org 市场 PR | ⏸ 等 npm 发布后（它从 registry 读包） |
| awesome-dsh-plugin PR | ⏸ 等仓库满 24 小时（**2026-10-21 17:21** 解禁） |

## 第一步：npm 发布（你来执行）

```sh
cd D:\ideaproject\dsh-plugins\dsh-markboard
npm login --registry https://registry.npmjs.org
npm publish --registry https://registry.npmjs.org
```

包名 `dsh-markboard` 在 npmjs 上未被占用（已确认 404），当前版本 `0.1.0`。

⚠️ 你的默认 registry 是 `npmmirror`，所以 `--registry` 必须显式带上，否则会推到镜像站。

发布成功后告诉我，我立刻跑第二个市场的 PR。

## 第二步：两个市场（我来提交，等你解锁）

发布完成后运行：

```sh
node scripts/submit-market.mjs --market dshopen
```

仓库满一天后运行：

```sh
node scripts/submit-market.mjs --market awesome
```

脚本会：检查门槛 → fork → 按各自格式准备改动（dshopen 改 `data/sources.json` 并跑它自己的 `validate.mjs`；awesome 新增 `data/plugins/guowenwei__dsh-markboard.yml`）→ 推分支 → `gh pr create`。

## 我需要你确认的两处营销口径

两个市场都要求描述只讲功能、不带营销词，且会被逐条核对代码。我准备用这段：

> **en**: Mark any conversation turn as a named task card, jump back to it later, and quote its answer into the composer. Marks stay in this browser.
>
> **zh**: 把任意一轮对话标记成任务卡：命名、跳回原处，并一键把结论填进输入框。标记保存在本机浏览器。

分类：dshopen 用 `interface`，awesome 用 `ui`。

## 一个待你决定的取舍

`package.json` 的 `files` 目前把 `src/`、`tests/`、`docs/` 一起发到 npm，包体积 1.6 MB（tarball）。

- **带上**：市场审核会读源码，用户也能直接看实现；`filesChecked` 证据更充分。
- **不带**：包体降到约 60 KB，但 npm 上就只有构建产物。

我倾向**带上**（审核友好，且这类插件包体积不是问题）。你要改的话说一声，我改成只发 `lib/ + cordis.patch.yml + locale/ + README`。

## 演示用的隔离实例

`http://127.0.0.1:3098/?token=hNNS58ccoTjsQNp1AzFQKPZUcCUBBdV7Z5hssBIfqxo`

这是从**发布 tarball** 装的实例，你的日常 3080 没被碰过。看完可以关掉——它只是个临时 home（`D:\dsh-tgz\home`）。

## 未做（明确不做）

- 不做宿主存储/跨设备同步
- 不做单条消息级标记、划词引用、悬浮导航轨
- 不做导出（如有需要，是下一个版本的事）
