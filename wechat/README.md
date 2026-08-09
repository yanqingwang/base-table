# 微信项目工作区（wechat/）

集中管理微信云托管、小程序（次卡管家）相关的**工作日志、记忆、任务、产出**，避免与其他项目（Joplin Sync、NoteForge、HRIS 等）互相干扰。

## 目录结构

| 目录 | 内容 |
|------|------|
| `memory/work.md` | **工作日志 + 📌 快速开始**（当前状态 / 部署命令 / 版本总览 / 各版本历史详情） |
| `docs/` | 分解文档：`部署手册.md`、`环境配置.md`、`版本状态.md` |
| `tasks/` | 任务文档（从 `wk/AITasks/` 复制） |
| `logs/` | OpenCode 会话日志关键节点（`opencode-sessions.md`） |

## 📄 分解文档入口

| 文档 | 内容 |
|------|------|
| [docs/部署手册.md](docs/部署手册.md) | 网页/后端部署（两仓库陷阱、空提交触发重建）、小程序上传（前置检查、常见错误）、人工提交审核流程、坑汇总 |
| [docs/环境配置.md](docs/环境配置.md) | AppID/AppSecret、云托管环境、公网地址、MySQL、IP 白名单、公众号、仓库路径 |
| [docs/版本状态.md](docs/版本状态.md) | 当前状态、版本发布状态总览表、待办（人工发布 v2.5.0 + IP 白名单） |

> 详细会话级记录与各版本根因/提交号 → `memory/work.md`

## 约定

1. **后续微信/小程序开发记录统一写** `wechat/memory/work.md`（不再追加到 `wk/memory/work.md`）
2. **代码仓库保持原位**（不移动）：
   - 后端：`code/card-counter-flask`（独立 git 仓库，云托管构建源）
   - 小程序：`code/card-counter-miniapp`
   - 云开发/云托管脚本：`code/card-counter-cloud`、`code/card-counter-cloudrun`
   - 公众号发布工具：`code/wechat-publisher`
3. **OpenCode 会话日志**：关键节点记录到 `wechat/logs/`，完整会话在 `~/.local/share/opencode/opencode.db`

## 快速参考（部署机制）

```bash
# 网页/后端（云托管读 card-counter-flask 仓库 main 分支）
cd code/card-counter-flask && git add <源码> && git commit && git push origin main

# 小程序上传
cd code/card-counter-miniapp
NODE_PATH=$(npm root -g) node scripts/upload_ci.js <版本> "<描述>"   # 前置：private.key md5=ff454fb9... + 出口IP白名单
```

> ⚠️ **两仓库陷阱**：只推父仓库 `base-table` 的 `python` 分支**不会部署**；云托管只读 `code/card-counter-flask` 仓库。
> 完整命令与坑 → `docs/部署手册.md`；密钥 → `docs/环境配置.md`；当前版本 → `docs/版本状态.md`
