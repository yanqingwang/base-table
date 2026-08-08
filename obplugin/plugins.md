# Obsidian 插件发布记录

## Joplin Server Sync (joplin-server-sync)

| 版本 | 日期 | 内容 |
|------|------|------|
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

## 发布方式

- **joplin-server-sync**：GitHub Actions 自动（tag `0.3.x` push 触发 release.yml）
- **三个 HTML 插件**：手动 `gh release create`（无 workflow，tag 不带 v 前缀）
