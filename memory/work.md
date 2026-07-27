
## 2026-07-25 Joplin Sync: Force Push/Pull 修复记录

### 问题根因
- **Force push 上传失败**：`listAllRemoteItems()` + DELETE 循环 + 创建文件夹 消耗了大量时间（~3 分钟），session 过期导致后续的 `uploadNote()` 调用全部 401。
- **`exec()` 401 重试**：重试时调用 `login()`，若密码包含特殊字符 `"`，JSON 序列化可能在 `requestUrl` 中异常。
- **结果**：服务器上只有 115 个文件夹和 1 个笔记，Force pull 无内容可下载。

### 修复
1. 在笔记上传循环前添加 `try { await api.login() } catch { }` 刷新 session
2. 为 uploadNote 添加 try/catch 和失败计数，不吞没错误
3. Notice 现在显示成功和失败数量

### 测试命令
- test vault: Force push to server
- test1 vault: Force pull from server
- 同步后通过 `ls /home/wang/文档/test1/*.md | wc -l` 验证数量

## 2026-07-25 Joplin Sync: Force Push 深层问题

### 核心问题
Force push 的 `uploadNote` 调用 `putItem` → `exec` → `requestUrl`。密码 `gcJG.<|QU6"\`` 含 `"` 字符，`JSON.stringify` 产生 `\"` 转义。但 `requestUrl` 在 Obsidian 中发送此 JSON 时可能因编码问题被 Joplin Server 拒绝（400 Bad Request），导致 login 失败。

### 连锁反应
1. login 失败 → session 无效 → 所有 API 调用 401
2. `exec` 重试一次 → login 再次失败 → ApiError 抛出
3. uploadNote 失败 → 0 note 上传成功
4. Force pull 无内容可拉

### 修复方向
1. 简化 forcePush，移除 `listAllRemoteItems` + DELETE 步骤，直接 upload
2. 跳过 session 失效问题
3. 如果仍有认证失败，需在 `JoplinServerApi.login()` 中增加调试日志

### 临时验证
通过 Python `urllib.request` 直接调用 API 一切正常（200 OK）。
怀疑 `requestUrl` 对含 `"` 字符的 JSON body 处理有差异。

### 建议
- 测试邮箱/密码是否包含特殊字符
- 若持续失败，考虑在 Obsidian 控制台查看 `[joplin-sync]` 日志

## 2026-07-27 Joplin Sync 插件完整开发记录

### 项目背景
Obsidian ↔ Joplin Server 双向同步插件 `obsidian-joplin-server-sync`，作者 rosswang。需要修复 push/pull 全流程，确保 test 和 test1 vault 结构一致。

### 关键问题与修复

#### 1. putItem 响应解析失败（SyntaxError）
- **现象**：所有笔记上传失败，报 `SyntaxError: Unexpected token`
- **根因**：`PUT /api/items/root:/:name:/content` 返回 Joplin 序列化格式（非 JSON），但代码用 `JSON.parse()` 解析
- **修复**：加 `?force=1` 后服务器返回 JSON，putItem 改用 `exec`（JSON 路径）而非 `rawRequest`

#### 2. 文件夹被 cleanup 意外删除
- **现象**：第二次 forcePush 后服务器文件夹全没了，笔记变成孤儿
- **根因**：已存在的文件夹从 mapping 复用时不加入 `pushedFolderIds`，cleanup 阶段被删除
- **修复**：复用文件夹也加入 `pushedFolderIds`；cleanup 中未知条目（不在任何 pushed 集合中）也删除

#### 3. 多层目录未完全发现
- **现象**：`a/b/c/d/e/file.md` 只创建了 `a/b/c/d/e` 文件夹，中间层缺失
- **根因**：目录发现只取 `file.path` 的直接父目录，不处理中间路径
- **修复**：拆分路径逐级添加所有父目录

#### 4. ForcePull 文件被放到 vault 根目录
- **现象**：pull 后所有文件在 vault 根目录，文件夹结构丢失
- **根因**：`forcePull` 直接 `title.md` 创建文件，未使用 `resolveFolderPath`
- **修复**：重写 forcePull，先建文件夹再下载笔记到正确子目录

#### 5. 资源文件（附件）路径错误
- **现象**：xlsx/docx 等被放到 `attachments/` 而非原路径
- **根因**：`downloadResource` 中 `meta.filename` 不含 `/` 时走了 fallback 路径 `attachments/`
- **修复**：直接用 `meta.filename` 作为路径，不判断是否含 `/`

#### 6. 内容去重导致同名文件丢失
- **现象**：`dl_hire.db` 在 3 个路径存在（root、AIReports/、AIReports/AIReports/），只有 1 个被同步
- **根因**：`uploadResource` 的去重逻辑 `hashToId.get(hash)` 直接 return，不创建不同路径的元数据
- **修复**：去重时 blob 和 metadata 用不同 ID——`blobId` 复用已有 blob，`metaId` 始终新建

#### 7. 空目录未同步
- **现象**：`20 Team/History/` 等空目录在 test1 中缺失
- **根因**：目录发现只从文件路径推导，空目录无文件触发
- **修复**：增加 `adapter.list()` 文件系统扫描，发现空目录

#### 8. 隐藏目录被同步
- **现象**：`.sisyphus` 出现在 test1 中
- **根因**：`walkDirs` 和文件路径发现未排除以 `.` 开头的目录
- **修复**：跳过隐藏目录

#### 9. 服务器登录失败
- **现象**：test vault 验证链接失败，test1 正常
- **根因**：data.json 中 serverUrl 末尾多了反引号 `` ` ``（从密码泄漏）
- **修复**：清除 URL 末尾特殊字符；`trimSlash` 增加反引号过滤

#### 10. 分页 2000 限制
- **现象**：超过 2000 个 item 时后续无法获取
- **根因**：首次请求加 `?limit=500` 被服务器拒绝（400）
- **修复**：移除 limit 参数，恢复纯 cursor 分页；增加 `!cursor` 安全跳出

#### 11. mapping 冲突导致资源不更新
- **现象**：旧 mapping 路径与新 path 不一致时，`downloadResource` 跳过下载
- **根因**：`existing` 检查 `blob_updated_time <= existing.remoteUpdatedTime` 返回旧路径
- **修复**：当 `existing.path !== correctPath` 时删除旧 mapping 强制重下

### 技术要点
- Joplin Server API：session 认证，items 用 `root:/:name:` 路径定位
- 每次请求 header `X-API-AUTH` + `X-API-MIN-VERSION: 2.6.0`
- PUT `/content` 返回 JSON（有 `?force=1`）或 Joplin 序列化（无 force）
- DELETE 不真正删除（软删除），但 listChildren 仍能看到
- Obsidian 插件 + CLI 共享 mapping 文件（`data/mapping.json`）

### 测试方法
- CLI：`node cli/sync-cli.cjs push|pull <vaultPath>`
- Obsidian：命令面板运行 Force push / Force pull
- 对比 `diff <(find test -name '*.md' | sort) <(find test1 -name '*.md' | sort)`

### 发布记录
| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v0.3.46 | 07-26 | forcePull folder path resolution |
| v0.3.47 | 07-26 | downloadResource parent dir auto-create |
| v0.3.48 | 07-26 | forcePull removes empty dirs |
| v0.3.49 | 07-26 | resource download clash, empty dir discovery, mime types |
| v0.3.50 | 07-27 | marketplace warnings, configDir, pathUtil regex |
| v0.3.51 | 07-27 | forcePush status bar, resource dedup fix |
| v0.3.52 | 07-27 | resource blob path fix (metaId=blobId), status bar persist (green/red) |
| v0.3.53 | 07-27 | forcePush resource re-upload (force param), v0.3.52 hotfix |
| v0.3.54 | 07-27 | resource upload/download progress in status bar (batched) |

## 2026-07-27 关键修复总结（v0.3.52 - v0.3.54）

### 核心问题：非 md 文件完全无法同步（test: 181 → test1: 0）
- **根因**：`uploadResource` 使用了两个不同 ID——blob 存 `.resource/<blobId>`，下载取 `.resource/<metaId>`，ID 不匹配导致 404；cleanup 逻辑用 `pushedResourceIds`（存 metaId）去匹配 blob 路径，把所有 blob 全部误删
- **修复**：统一使用 `metaId` 作为唯一标识，blob 和 metadata 共享同一 ID，移除分离的 `blobId`
- **附加强制重传**：forcePush 传入 `force=true` 跳过 mapping hash 检查，确保旧路径的 blob 被新路径覆盖
- **批量上传**：资源文件改为 5 个一批并行上传，大幅提速

### 用户体验改进
- 状态栏持久显示：成功绿色 `Joplin: OK 14:23 (N items)`，失败红色 `Joplin: error`
- 资源同步进度：push/pull 时实时显示 `files N/total`

### 整体状态
同步插件全流程已基本稳定：笔记、目录、附件（png/xlsx/pptx/docx/html/py 等）均可双向同步。
已知局限：服务器软删除导致历史 item 累积；CLI 登录被服务器拒绝（仅 Obsidian 插件可用）。

### 发布
- GitHub: https://github.com/yanqingwang/obsidian-joplin-server-sync
- 最新版本: v0.3.54 (已推送 tag + release + Obsidian 市场)
