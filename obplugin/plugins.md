# Obsidian 插件发布记录

## Joplin Server Sync (joplin-server-sync)

| 版本 | 日期 | 内容 |
|------|------|------|
| 0.4.4 | 2026-08-15 | **并行 delta-pull + 请求超时重试**：DeltaPuller 两段式拉取（先读 delta 元数据，再并行 5 批量下载变更内容，1000+ 项从 15+ 分钟降到 <30s）；删除 id 并行验证后再本地应用（applyDelete→applyDeleteLocal）；JoplinServerApi 每请求 120s 超时（防止连接卡死 wedged sync）、429/5xx/网络错误退避重试、任意 attempt 401 自动重登；新增 delta-pull-verify.ts 端到端 mock 测试 |
| 0.4.2 | 2026-08-10 | **市场评审修复 + 稳定性**：release tag 去掉 v 前缀（市场要求 tag=manifest version 不带 v）；delta 批量删除守卫改"验证后逐个应用"（不再 wedging sync）、force 后 changelog flush、watcher ENOENT、forcePush 空目录发现统一磁盘 adapter、forcePull rmdir 递归标志；清理评审警告（configDir 原生属性、console.debug、未用代码、类型安全） |
| 0.4.1 | 2026-08-09 | **forcePull 孤儿文件夹删除修复（B15）**：adapter.list('') 在 Obsidian 返回 `./` 前缀目录名被旧过滤跳过 → 改用 getAllLoadedFiles() 枚举，forcePush 空目录发现同步修正 |
| 0.4.0 | 2026-08-09 | **多库安全 + 可靠性大版本**：forcePush/forcePull 只作用于本 vault 项（不误删他库）、首同步全量对账、force 操作挂起 watcher、深层 delta 回落 mapping、删除风暴守卫用户出口、服务器加密状态会话缓存、push 侧冲突检测、隐藏文件（点开头）全局排除、登录单飞、E2EE key 未加载 fail-hard |
| 0.3.72 | 2026-08-08 | **防误删修复**：applyDelete 404 验证、批量删除风暴保护、vault 根文件夹隔离、belongsToRoot 祖先链、info.json vaultId 警告 |
| 0.3.71 | 2026-08-08 | README 全英文重写 + 同步通知中文改英文 |
| 0.3.70 | 2026-08-07 | forcePull fileManager fallback（测试环境兼容） |
| 0.3.69 | 2026-08-07 | 同步历史表显示 新建/更新/删除 列 |
| 0.3.68 | 2026-08-07 | 文件夹移动到新父目录修复 |
| 0.3.67 | 2026-08-07 | 移动/重命名同步 + 空目录同步 |
| 0.3.66 | 2026-08-07 | 多终端一致性（fileId + 变更日志） |
| 0.3.65 | 2026-08-07 | 同步完成通知显示数量 |
| 0.3.64 | 2026-08-07 | 文件夹删除同步修复 |
| 0.3.63 | 2026-08-07 | E2EE 密钥验证 + 迁移保护 |
| 0.3.62 | 2026-08-07 | 资源 blob 解密修复 |
| 0.3.61 | 2026-08-07 | E2EE 启用开关 |
| 0.3.60 | 2026-08-07 | master key 双阶段保护 |
| 0.3.59 | 2026-08-07 | walkDirs 过滤修复 |
| 0.3.58 | 2026-08-07 | forcePush 先删后传 + verifycount CLI |
| 0.3.57 | 2026-08-07 | E2EE 协议重写（对齐官方 Joplin） |
| 0.3.56 | 2026-08-07 | 市场 lint 清理 |
| 0.3.55 | 2026-08-07 | 市场 lint 清理 |
| 0.3.54 | 2026-08-07 | 资源 blob 路径统一 |
| 0.3.53 | 2026-08-07 | 资源 blob 路径统一 |
| 0.3.52 | 2026-08-07 | 资源 blob 路径统一 + 状态栏持久化 |

## HTML Effectiveness (html-effectiveness)

| 版本 | 日期 | 内容 |
|------|------|------|
| 1.0.23 | 2026-08-08 | README 中英双语（英文在前）+ UI "建议:" → "Recommendation:" |
| 1.0.22 | 2026-07-13 | marketplace review errors 修复 |

## MD to HTML Effectiveness (md-to-html-effect)

| 版本 | 日期 | 内容 |
|------|------|------|
| 1.0.25 | 2026-08-08 | README 中英双语 |
| 1.0.24 | 2026-07-13 | loadSettings 类型断言清理 |

## HTML to MD Effectiveness (html-to-md-effect)

| 版本 | 日期 | 内容 |
|------|------|------|
| 1.0.3 | 2026-08-08 | README 中英双语 |
| 1.0.2 | 2026-07-13 | marketplace review errors 修复 |


## Joplin Sync Single Vault (joplin-sync-single-vault)

| 版本 | 日期 | 内容 |
|------|------|------|
| 0.1.0 | 2026-08-10 | **首个版本**：一个账号 = 一个 vault。本地 vault 下一层平铺同步到服务器根（无 `_vault_<name>` 隔离）；force push 删除服务器全部内容（保留 info.json/master keys）后重传；force pull 拉取服务器全部到当前 vault。同名第二端内容完全一致。release tag 不带 v（市场要求）。 |
## 发布方式

- **joplin-server-sync**：GitHub Actions 自动（tag `0.3.x` push 触发 release.yml）
- **三个 HTML 插件**：手动 `gh release create`（无 workflow，tag 不带 v 前缀）
