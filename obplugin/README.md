# Obsidian Plugins 工作区

集中存放 Obsidian 插件相关的**记忆副本与工作结果**。源码仓库保留在 `code/` 原位不动。

effectiveness refer to skill-html-effectiviness, if update identified, update the plugin too.

## 目录

| 路径 | 内容 |
|------|------|
| `memory/obsidian-plugins-work.md` | 插件开发记忆副本（从 `memory/work.md` 提取的 obsidian 相关段落） |
| `plugins.md` | 插件清单与发布状态 |

## 插件清单

| 插件 | ID | 源码位置 | 最新版本 | 发布仓库 |
|------|-----|---------|---------|---------|
| Joplin Server Sync | joplin-server-sync | `code/obsidian-joplin-server-sync` | 0.4.2 | yanqingwang/obsidian-joplin-server-sync |
| HTML Effectiveness | html-effectiveness | `code/html-effectiveness-plugin` | 1.0.23 | yanqingwang/obsidian-html-effectiveness |
| MD to HTML Effectiveness | md-to-html-effect | `code/md-to-html-effect-plugin` | 1.0.25 | yanqingwang/obsidian-md-to-html-effect |
| HTML to MD Effectiveness | html-to-md-effect | `code/html-to-md-effect-plugin` | 1.0.3 | yanqingwang/obsidian-html-to-md-effect |

## ⚠️ 关键教训（2026-08-08 事故）

**跨 vault 数据丢失**：joplin-server-sync v0.3.71 及更早版本中 `rootFolderId` 从未生效
（硬编码空字符串），多 vault 共用同一服务器账号时，旧 delta cursor 重放会误删本地文件。
v0.3.72 已修复：applyDelete 前验证服务器 404 + 批量删除风暴保护 + vault 根文件夹隔离。

**使用规则**：

- 每个 vault 使用**独立的 Joplin 账号**，不要跨 vault 共用
- 升级插件前备份 `.obsidian/plugins/joplin-server-sync/data/`（mapping/changelog）
- Obsidian 只从各自 vault 的 `.obsidian/plugins/` 加载插件，本目录不参与运行时加载
