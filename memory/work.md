
> 📂 **obsidian 插件相关记忆已归档**：完整开发记录 → `obplugin/memory/obsidian-plugins-work.md`，插件清单与发布状态 → `obplugin/plugins.md`，索引与教训 → `obplugin/README.md`。源码保留在 `code/` 原位。下方是历史记录（与新记忆同步维护）。

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


## 2026-08-02 NoteForge ↔ Obsidian Joplin E2EE 兼容性（方案 A 覆盖）

### 已验证（算法层通过）
- NoteForge JoplinE2ee 完全符合 Joplin 标准（KeyV1 主密钥/StringV1 笔记/FileV1 资源/JED01 格式）
- 加密→解密往返 roundtrip match=true（real server 配置测试）

### 服务器协议边界（关键）
- **裸 `<hex>.md` 名上传 → 服务器 500**（强制 JSON 校验）
- **`nf-<id>.md` 前缀名上传 → 200 成功**
- Obsidian discoverMasterKeys 正则只认 `<32hex>.md` → NoteForge 的 `nf-` 主密钥 Obsidian 无法发现

### 互通结论
| 操作 | 结果 |
|------|------|
| 下载 Obsidian 裸hex加密笔记+同密码解密 | ✅ 管线已实现（load_server_master_keys + decrypt_downloaded_body）|
| 上传用 nf- 前缀 | ✅ |
| nf- 主密钥给 Obsidian 用 | ❌ 正则限制 |

### 方案 A（覆盖策略）
- NoteForge 用自有 key + 明文覆盖服务器旧数据
- 旧 Obsidian 加密数据（b0b25f2b key 缺失，服务器不存在该 key item）→ 无法解密，覆盖之
- 覆盖上传 = 删除服务器对应旧 item + 用 nf- 重建；下载 = 清本地 + 重新拉取

### 若要全兼容 Obsidian
- 需改 Obsidian discoverMasterKeys 正则接受 `nf-` 前缀，或让 NoteForge 能裸hex上传（服务器需配合）
- 文档：AIReports/NoteForge-Obsidian-Joplin-*.md

## 2026-08-06 E2EE 协议重写 + forcePush 先删后传（v0.3.57-0.3.60）

### E2EE 协议重写（v0.3.57）
原实现与官方 Joplin 协议严重不符（enum 值 off-by-one、主密钥大小错误、块格式错误），与 Joplin 客户端完全不兼容。按 `laurent22/joplin` dev 分支重写：

| 协议项 | 官方规范 | 修复 |
|--------|---------|------|
| enum | SJCL1a=5, KeyV1=**8**, FileV1=**9**, StringV1=**10** | ✅ 修正（原为 4/7/8/9） |
| Header | `JED01` + 6-hex len + 2-hex method + 32-hex keyId | ✅ |
| 主密钥 | 256 随机字节 → 512 hex，KeyV1 包裹（PBKDF2-SHA512 220000 次） | ✅ |
| StringV1 | utf16le 编码，64k 块，PBKDF2-SHA512 3 次 | ✅ |
| FileV1 | base64 编码，128k 块 | ✅ |
| 块格式 | `[6-hex len][JSON{salt,iv,ct} base64]` | ✅ |

### 验证（全部通过）
- 自测 `test/e2ee.test.ts`：24/24（往返、多 chunk、篡改检测、emoji 代理对）
- 互操作 `test/e2ee-interop.test.ts`：7/7（独立实现官方算法双向交叉验证）
- `e2eeserver`：6/6（真实服务器主密钥/笔记/资源往返）
- `e2eesync`：9/9（实时同步路径加密/解密）
- verifycount 密文检查：3/3 JED01，无明文泄漏

### forcePush 先删后传（v0.3.58）
- **问题**：服务器累积 2321 个 item（历史垃圾），本地只有 30 个文件
- **修复**：reset 阶段先删除服务器所有 item（保护 info.json + master key），清空 mapping，再重新上传
- **walkDirs 修复**：只物化子树含可同步文件的目录，避免 `home/wang/文档/test` 嵌套（Obsidian 运行时产物）被当文件夹上传
- **master key 保护**（v0.3.60）：enableE2EE 只缓存 id 不进 mapping，reset+cleanup 依赖 mapping 判断导致 master key 被误删 → 显式保护 `e2ee.availableMasterKeys` + `mapping.e2eeMasterKeyId`

### CLI 验证命令
- `verifycount <vault>`：fs 遍历本地 vs 服务器 item（笔记/文件夹/资源/密文）对比
- `e2eeserver` / `e2eesync` / `verifyenc`：E2EE 服务器端验证
- 一键脚本：`test/full-sync-verify.sh`（需先关闭 Obsidian）

### 已知问题
- **Obsidian 运行中无法磁盘级测试**：Obsidian 打开 test/test1 vault 时会删除 CLI 创建的测试文件、后台同步到同一服务器（同一账号）产生重复 item → 必须在 Obsidian 关闭后测试
- 测试环境：test/test1 均配置同一服务器账号 289631530@qq.com + e2eePassword='qqqqqqqq'

### 发布
| 版本 | 内容 |
|------|------|
| v0.3.57 | E2EE 协议重写 |
| v0.3.58 | forcePush 先删后传 + verifycount CLI |
| v0.3.59 | walkDirs 过滤修复 |
| v0.3.60 | master key 双阶段保护（reset + cleanup） |
| v0.3.61 | E2EE 启用开关（e2eeEnabled toggle + password 双条件） |

### E2EE 开关（v0.3.61）
- 新增 `e2eeEnabled: boolean` 设置（默认 false）
- 启用条件：**开关 ON + 密码非空**（此前密码非空即自动启用）
- SettingsTab：开关 toggle；关闭时密码框和 Load keys 按钮禁用
- 逻辑测试 3/3 通过：开关OFF+密码→禁用 / 开关ON+空密码→禁用 / 开关ON+密码→启用
- test/test1 data.json 已设 `e2eeEnabled: true` + 密码 qqqqqqqq

### 资源 blob 解密修复（v0.3.62）
- **Bug**：forcePull 收集阶段已解密 resource meta（`encryption_applied` 变 0），`downloadResource` 靠 meta 标志判断 blob 是否加密 → 误判为明文 → blob 以密文写入磁盘（PNG 文件头是 `JED01000` 而非 `\x89PNG`，sample.bin 从 2048 膨胀到 2870 字节）
- **修复**：从 blob 内容本身判断（前 5 字节是否 `JED01`），与 meta 状态解耦
- **验证**：隔离环境完整磁盘级校验通过——sample.bin 恢复 2048 字节、PNG 头 `\x89PNG`、push+verifycount+pull+verifycount 全部 PASS

### 隔离环境完整磁盘级校验（不受 Obsidian 干扰）
在 `/tmp/e2ee-vault-test` / `-test1`（同一服务器账号 + e2eeEnabled=True）完成：
1. **push**：reset wiped 14 items → 3 notes + 2 files 加密上传
2. **verifycount(test)**：3 notes/3 folders/2 metas/2 blobs 与本地 5 文件+3 目录完全匹配，E2EE 3/3 JED01 无明文泄漏 → PASS
3. **test1 pull**：E2EE 解密拉取 5 文件（blob 解密修复生效）
4. **verifycount(test1)**：数量一致 → PASS

### 已知限制
- Obsidian 运行中会删除 CLI 创建的测试文件、后台同步到同一服务器、覆盖 e2eeEnabled 配置（旧版插件不认识该字段）→ 磁盘级测试需在隔离环境或 Obsidian 关闭后进行

### 文件夹删除同步修复（v0.3.64）
- **DiskAdapter.rmdir**：`fs.rmSync(recursive:false)` 删目录报 `EISDIR` → 改用 `fs.rmdirSync`，forcePull 才能真删空目录
- **DeltaPuller.applyDelete**：`"stat" in f` 对 TFolder 永远 false（无 stat 属性）→ 文件夹被 unmapped 但本地不删 → 改用 `instanceof TFile`（文件）+ `vault.remove()`（文件夹）
- **forcePull 父目录过滤**：vault 在 /tmp 下时 `adapter.list('')` 返回父目录 `tmp` → 自底向上删除会误入 .obsidian 清配置 → 过滤含 `/` 的路径
- **隔离验证**：删除文件夹B → push → pull → 文件夹B 消失、配置保留、其余 3 notes 完好

### 文件/文件夹移动重命名同步修复（v0.3.67-0.3.68）
- **移动/重命名不同步根因**：`upsertItem` 内容不变（hash 相同）直接跳过 → 服务器 `parent_id/title` 不更新；`renameItem` 先改 mapping 路径 → 移动对 upsertItem 不可见
- **修复**：upsertItem 加 force 参数（路径变也强制上传）；renameItem 不预改 mapping；文件夹重命名时 PUT 更新服务器 title
- **文件夹移动到新父目录**：新父目录无服务器映射时文件夹落到根 → renameItem 调 `ensureFolderChain` 确保新父映射存在（v0.3.68）
- **空目录同步**：walkDirs 要求子树含可同步文件 → 真空目录被过滤 → 改为物化所有空目录，仅排除 home/Library/node_modules 系统目录（v0.3.67）
- **一致性保障**：打开必拉最新，关闭必推未同步，多设备切换不会丢数据
- **已上传**：2.3.5 ✅（待人工提交审核）

---

## 2026-08-09 Joplin Server Sync v0.4.0：多库安全 + 可靠性大版本（核心参照）

> 三批外部评审（B 系列 B1-B34 + C 系列 C1-C14）驱动的系统重构。源码：`code/obsidian-joplin-server-sync`，已发布 v0.4.0（GitHub Actions 自动 release，tag `v0.4.0`）。

### 一、核心架构决策（后续改动的第一参照）

1. **共享根镜像模型**：所有 vault 共用服务器上同一个 `_vault_<name>` 根文件夹（第一个 push 的 vault 创建）。镜像端（test1/新库）首 sync 自动"收养"该根 id → 本地无前缀、与 owner 内容一致。**不要**改成评审建议的"每 vault 独立子树 + C 订阅全部"——那与验收（test==test1）冲突。
2. **body/hash 唯一口径**：服务器 body = 磁盘完整内容（含 `joplin-file-id` frontmatter）。拉取先 stamp 再算 hash，推送对磁盘内容算 hash（`stampFrontmatter` 是 FileIdentity 导出的纯函数，DeltaPuller/SyncEngine 共用）。违反此口径 = 推拉乒乓 + 假冲突。
3. **id 唯一来源**：`identity.ensureId(file)`（frontmatter），禁止 `createJoplinId()` 直接当文件 id（InitialSync 已统一）。附件 id 永远复用 `existing.joplinId`，force 只影响 hash 跳过。
4. **统一排除规则**：`SyncEngine.shouldExclude(path)` = excludePatterns + configDir + `_conflicts/` + **任意路径段点开头**（隐藏文件/文件夹）。所有调用点（push/pull/watcher/force/InitialSync）必须走它，禁止内联 isExcluded。
5. **统一并发锁**：syncCycle/forcePush/forcePull/runFullUpload 共享 `this.running` 标志。**不要**用两套锁（旧代码 syncCycle 用 state、其他用 running → 并发互踩）。

### 二、三批评审的关键缺陷与修复（对照表）

| 编号 | 缺陷 | 修复要点 | 文件 |
|------|------|---------|------|
| B1/B2 | belongsToRoot 父链死循环（pid 赋回自身）+ parent_id 空丢弃 | 用本批 parent_id 图 + Resource/MasterKey 豁免 + 回落 mapping | DeltaPuller |
| B3 | owner 根映射成 `_vault_<name>/` 导致自己文件被搬家 | 根 id 映射本地 `''`（buildForcePullFolderPaths + resolveForcePullFolderPath 特判） | SyncEngine |
| B4/C2 | 新库首 sync 跳 cursor，永远拉不到已有内容 | InitialSync 调 guard-free `forcePullInner()` + 早退分支也消费 delta 设 cursor | InitialSync |
| B5 | forcePush reset 删光整台服务器 | reset/cleanup 只删 `ownedIds`（clearAll 前捕获的 mapping id），他库项保留 | SyncEngine |
| B5.2 | 根文件夹被 cleanup 当孤儿删（clearAll 后 mapping 查不到） | `pushedFolderIds.add(rootFolderId)` | SyncEngine |
| B6 | 拉取 hash 按未 stamp body 算 → ping-pong | stampFrontmatter 共享函数，hash 统一 stamped 口径 | FileIdentity/DeltaPuller |
| B7 | `includes('encryption_applied: 1')` 正文误判加密 | unserialize 判字段 | SyncEngine |
| B9 | safeFileName 不足 + forcePull 同名覆盖 | Windows 非法字符/保留名/尾点/长度 + usedPaths 去重加 id 后缀 | pathUtil/SyncEngine |
| B13 | forcePull 不清 mapping | 开头 clearAll() | SyncEngine |
| B18 | 附件冲突只查 mapping 不查磁盘 + 怪路径 | 查磁盘 + basename 后缀 | ResourceManager |
| B19 | E2EE 附件先跳过判断后解密 → 永远跳过 | 先解密 meta 再判断 | ResourceManager |
| B20 | force 时附件无条件换 id → 孤儿 blob + 链接悬空 | 复用 existing.joplinId | ResourceManager |
| B21 | watcher onload 注册 → 启动 create 风暴 | 包进 `onLayoutReady` | main |
| B22 | 二进制走 ensureId（往 png 插文本，数据损坏） | 按扩展名分流 Note/Resource，二进制用 mapping/path 身份 | VaultWatcher |
| B24 | E2EE active 但 key 未加载 → 静默明文上传 | fail-hard 抛错 | LocalPusher/ResourceManager |
| B26 | delta cursor 失效无恢复 | 400/cursor invalid 自动清 cursor 全量对账 | DeltaPuller |
| B28 | 未知 type_ 无白名单 | 白名单 {Note=1, Folder=2, Resource=4, MasterKey=9} | DeltaPuller/SyncEngine |
| B30 | suppress 2 秒窗口吞用户编辑（delete 被吞则文件复活） | 一次性 token（首个匹配事件消费）+ 5s 兜底 | VaultWatcher |
| B32 | trimSlash 反引号笔误 / 每 200 调用重登 / login 无单飞 | `/\/+$/` + 删 REFRESH_INTERVAL + in-flight promise + 429 退避 | JoplinServerApi |
| B33 | loadSettings 浅拷贝 → syncLog 共享引用污染默认值 | 深拷贝 syncLog | main |
| C1 | forcePush 清空他库数据（最高优先） | ownedIds 归属判定（见 B5） | SyncEngine |
| C3 | force 操作制造 delete/create 风暴 → 级联清空 | watcher suspend/resume + changeLog.clear() | VaultWatcher/ChangeLogStore |
| C4 | 深层 delta 父链不在批内 → 静默丢弃 | 回落 mapping + 回填 rootAncestorCache | DeltaPuller |
| C5 | >50% 删除守卫无出口 → 永久卡死 | Notice 提示 forcePull/forcePush 出路 | DeltaPuller |
| C6 | 每周期全库 GET（O(n) 请求） | serverIsEncrypted 会话缓存 + E2EE 关闭短路；force 前失效 | SyncEngine |
| C7 | push 先于 pull 无条件覆盖 → 并发编辑丢失 | upsertItem 比较 remote.updated_time 冲突交 ConflictResolver | LocalPusher |
| C8 | forcePull 本地清空无视 excludePatterns | kept 并入 excludePatterns（后统一走 shouldExclude） | SyncEngine |
| C10 | uniquePath 只防"文件+mapping 都在" | 文件存在且（无 mapping 或 id 不同）即加后缀 | DeltaPuller |
| C11 | 解密失败 return [] 且 cursor 前进 → 永久丢失 | 抛 tagged 错误，pullAll 捕获后不推 cursor | DeltaPuller |
| C13 | `.resource/<id>` 斜杠被 encodeURIComponent 成 %2F | 段内编码保留 / | JoplinServerApi |
| C14 | mapping.json 损坏 → onload 直接炸 | try/catch + 备份 .corrupt + .tmp 恢复 | MappingStore |

### 三、经验教训（踩过的坑）

1. **CLI 测试的 manifest.dir 必须是 vault 相对路径**（`.obsidian/plugins/joplin-server-sync`），不是绝对路径。MappingStore 把它传给 DiskAdapter（root=vaultRoot）做 `path.join` → 绝对路径会拼出 `/vault/vault/...` 错误路径，**CLI 下 mapping 从未真正持久化**（mtime 不更新就是信号）。这是 CLI 环境最隐蔽的坑。
2. **CLI 环境没有真实 GUI**：Modal 确认会卡死（mock 需补 createDiv）、Notice 不显示。测试加密迁移/删除守卫等 UI 路径时用 CLI 只能验证"卡在确认"而非完整流程。
3. **Obsidian 未运行≠pgrep 无结果**：`pgrep -f app.asar` 会命中 Joplin Desktop（`/usr/lib/joplin-desktop/app.asar`）。精确判断用 `pgrep -f "obsidian/app.asar"` 或 `ps aux | grep [o]bsidian | grep -v joplin`。
4. **服务器 info.json 的 e2ee 标记可能是脏的**（历史迁移残留 e2ee:true 但无 master key/加密项）→ 判断服务器加密状态必须看实际数据（master key type_=9 或 encryption_applied=1），不能信 info.json。
5. **forcePush 的 reset 语义**：共享根模型下"删光重建"= 只删自己 mapping 的项。否则第二个 vault 一 push 就抹掉第一个 vault 的数据（C1 事故场景）。
6. **force 操作必须挂起 watcher**：否则本地删除/重建的每个文件都进 changelog，下轮 pushAll 按 path 命中新 mapping 反向删服务器（C3 数据丢失链）。
7. **测试数据会污染**：test vault 是用户活跃工作库（持续写入），对比"服务器==test"要在 forcePush 后立即做；test1 快照会滞后。验证脚本要能剥 `_vault_<name>/` 前缀比镜像端。

### 四、验收基线（0.4.0 全部通过，回归参照）

- **验收1**：test forcePush → 服务器与 test 一致（md + 附件逐文件 sha256，归一化 joplin-file-id）
- **验收2**：test1 forcePull → test1 == test（240+ 文件内容一致）
- **验收3**：幂等（连续 syncCycle 无 mtime 变化）+ 加密四场景（未加密↔未加密允许；本地加密+服务器未加密 sync/pull 阻止、forcePush 弹迁移确认；服务器加密+本地未加密三入口全阻止）
- **隐藏文件**：`.hidden/`、`.drafts/`、`.env`、`.omo/`、`.noteforge/` 全部不上传不拉取；`temp/` excludePatterns 与点开头叠加；force 操作遵守；正常文件（含 .db）不受影响

### 五、测试命令（磁盘级，Obsidian 需关闭）

```bash
cd /home/wang/wk/code/obsidian-joplin-server-sync
node cli/build.mjs          # 重建 CLI（含新代码）
node cli/sync-cli.cjs push <vaultPath>   # forcePush
node cli/sync-cli.cjs pull <vaultPath>   # forcePull
node cli/sync-cli.cjs sync <vaultPath>   # syncCycle
# 服务器一致性验证（临时脚本模式，用完即删）：
#   枚举服务器 item → 建 parent 链 → resolve 路径 → 归一化 hash 比对本地
```

### 六、发布记录

- **0.4.2**（2026-08-10）：**市场评审修复 + 稳定性**。⚠️ 关键教训：Obsidian 市场要求 release tag 与 manifest version **完全一致且不带 v 前缀**（`0.4.2` 而非 `v0.4.2`）——此前 v0.4.0/v0.4.1 带 v 被市场拒绝（"No release matches your manifest version"）。本次 tag `0.4.2` 触发 GitHub Actions 自动 release。同时修复 delta 批量删除守卫 wedging、force 后 changelog flush、watcher ENOENT 等；清理评审警告（configDir 原生属性、console.debug、未用代码、类型安全）。已部署 4 个 vault。
- **v0.4.0**（2026-08-09）：上述全部修复。tag `v0.4.0` push 触发 GitHub Actions 自动 release（assets: main.js/manifest.json/styles.css）。已部署 4 个 vault（/home/wang/wk、test、test1、Obsidian Vault）。
- **发布方式**：joplin-server-sync 用 GitHub Actions（push tag **不带 v**：`0.3.x`/`0.4.x` 自动），三个 HTML 插件手动 `gh release create`（tag 不带 v）。⚠️ 市场评审要求 release tag = manifest version（无 v 前缀）。

### 2026-08-09 forcePull 不删孤儿文件夹（B15 落地修复）

- **症状**：force pull 时，服务器上不存在但本地存在的文件夹没有删除（空目录、孤儿目录残留）。
- **根因**：目录删除用 `adapter.list('')` 枚举 + `d.includes('/')` 过滤。CLI 的 DiskAdapter 返回无前缀路径（`orphan-dir`）能删；但 **Obsidian 真实 adapter.list('') 返回带 `./` 前缀的目录名** → `d.includes('/')` 全部过滤 → rootDirs 为空 → 一个目录都不删。这就是评审 B15 预言的"adapter.list('') 不可靠"，当时未修，实测暴露。
- **修复**：
  - forcePull 目录枚举改用 **`vault.getAllLoadedFiles()` 过滤 TFolder**（Obsidian 保证 vault 相对路径，跨环境可靠），自底向上 `adapter.rmdir`。
  - forcePush 的 walkDirs（空目录发现）同样改用 getAllLoadedFiles，统一 B15 语义。
  - MockVault 补 `getAllLoadedFiles()`（返回 TFile + TFolder，CLI 可测）。
- **验证**：嵌套孤儿目录、空孤儿目录全部删除；隐藏目录（shouldExclude）保留；正常同步不受影响。
- **教训**：**adapter.list('') 的返回格式跨环境不可靠（Obsidian 可能带 `./` 前缀），枚举 vault 内路径一律用 `vault.getAllLoadedFiles()`**；`d.includes('/')` 这类前缀过滤是隐患。

### 2026-08-09 forcePull 文件夹删除二次修复（Obsidian 实测暴露）

- **症状**：用户在 Obsidian 里实测 force pull，本地孤儿文件夹（服务器不存在的）未删除。CLI 测试通过但真实环境失败。
- **第一次修复（B15）用 getAllLoadedFiles 失效**：vault API 返回 Obsidian **内存文件模型**，trashFile 删除数百文件后模型滞后/省略目录 → 枚举不到待删文件夹。CLI 的 MockVault.getAllLoadedFiles 是磁盘扫描，掩盖了差异。
- **最终修复（磁盘权威）**：目录枚举改回 `adapter.list()` 递归（磁盘为准，不依赖 Obsidian 内存模型），`normDir()` 清洗 `./` 前缀/尾斜杠/`.`/`..`，`adapter.rmdir(d, true)` 递归删除，失败 `console.warn` 暴露（不再 `.catch(() => {})` 静默吞错）。
- **教训（重要）**：
  1. **CLI mock 与真实 Obsidian 的 API 行为差异是最大陷阱**——MockVault 的 getAllLoadedFiles 是磁盘扫描、adapter.list 无 `./` 前缀；真实 Obsidian 的 adapter.list('') 返回 `./` 前缀、vault 内存模型滞后。凡是"枚举文件/目录"必须用**磁盘级 adapter**（list/exists/rmdir），不要依赖 Obsidian 内存模型 API。
  2. 删除/写入类操作失败**绝不能静默吞错**——`console.warn` 至少让用户可诊断。
- **验证**：CLI 嵌套/空目录删除 + 隐藏保留 + normDir 9 种输入清洗；完整回归（test push→test1 pull→一致性）通过，差异仅为隐藏文件排除 + test 新写入（预期）。

### 2026-08-09 补充：forcePush 空目录发现也统一磁盘 adapter（B15 完整落地）

- forcePush 的 walkDirs（空目录发现）之前也用了 `getAllLoadedFiles()`——与 forcePull 文件夹删除同样的失效模式（真实 Obsidian 内存模型滞后/省略目录）。
- **修复**：walkDirs 改为 `adapter.list()` 递归 + `normDir()` 清洗（与 forcePull 一致）；`normDir` 提升为模块级函数（forcePush/forcePull 共用）。
- **教训（强化）**：**所有"枚举 vault 文件/目录"必须走磁盘级 adapter（list/exists），禁止用 getAllLoadedFiles（内存模型）**——CLI mock 是磁盘扫描掩盖了差异，真实 Obsidian 才暴露。删除类操作失败必须 console.warn（已落实）。
- 部署 md5 变化轨迹：89411788（adapter.list 版）→ 599c5fbc（rmdir(false) 防误删 kept）→ 07c87715（walkDirs 统一）。**用户 Obsidian 进程启动(12:51)早于部署(13:18+) → 必须重载插件加载最终版。**

### 2026-08-09 用户 Obsidian 控制台日志驱动的 3 个修复（0.4.1 后）

用户贴出 Obsidian 控制台完整错误堆栈，暴露 3 个真实 bug（CLI 测试无法覆盖的真实环境问题）：

1. **ENOENT 崩溃刷屏**：`ensureId ← record ← onEvent ← removeFile` —— VaultWatcher.record 对 **delete 事件也调 `ensureId(file)`**（读 frontmatter），但文件已删除 → `ENOENT: no such file` 未捕获异常。修复：delete 事件用 mapping/path 身份，不读文件。**教训：watcher 的 delete 分支绝不能碰文件内容**。
2. **同步永久卡死**：`refusing 508/1016 delta deletes over 549 mapped items` —— test forcePush 重建服务器（旧 id 全删、新 id 重建），test1 的 delta 流重放**旧 id 的 delete 事件**；守卫看 `deletes.length` 而不是"mapping 里真实存在的 id"→ 整批拒绝 + cursor 不推进 → 每轮卡死。修复：守卫只统计 `mapping.getById(id)` 存在的 delete（applyDelete 对不存在的 id 本就是 no-op）。**教训：删除守卫必须按"相关删除数"而非"原始删除数"判断**。
3. **changelog 清空不持久化**：`changeLog.clear()` 只置 dirty 标志，forcePush/forcePull 的 finally 没 flush → 502 条 pending 垃圾（旧代码无 watcher 挂起时产生）每次 sync 重放失败。修复：finally 里 `await changeLog.flush()`。
4. **环境教训**：用户 Obsidian 启动(12:51)早于部署(13:25+) → 跑旧代码 → 之前"文件夹未删"实测是旧代码行为。**发布修复后必须让用户重载插件/重启 Obsidian 才生效**。
5. **验证方法**：临时 vault 复制 test1 的污染 mapping/changelog → forcePull → 断言 pending=0 + sync 幂等（不 refusing）。

- 部署 md5 轨迹：89411788 → 599c5fbc → 07c87715 → e7b13de → c43ab8ad（最终）。

### 2026-08-10 补充：delta 删除守卫最终修复（用户日志第三次迭代）

- **问题**：守卫改为"只统计 relevantDeletes（mapping 存在）"后仍卡死——test1 的 mapping **确实有**那些旧 id（test1 之前同步过 test 的旧内容），所以过滤后仍 508/1016 个 → 仍拒绝 → 仍卡死。
- **最终修复**：守卫从"拒绝整批 + 不推 cursor"改为"警告 + 逐个应用"——因为 **applyDelete 本身有服务器 404 验证兜底**（`stillThere !== null` 跳过本地删除），stale replay 不会误删，真实删除（forcePush 重建）正确清理。守卫的价值（避免几百次 GET）应让步于恢复同步。
- **教训（重要）**：**任何"保护性拒绝"都必须有恢复路径，否则就是永久卡死**。applyDelete 的服务器验证已经是正确的安全网，上层的批量守卫是多余的（且有害）。
- 部署 md5 轨迹：c43ab8ad → 3512c386（delta 守卫警告版）。commit：6dccbc0。

### 2026-08-15 joplin-server-sync v0.4.4：并行 delta-pull + 请求超时重试（已发布）

- **背景**：0.4.3 已发布后，源码仓库有未提交改动（JoplinServerApi + DeltaPuller）。本次先构建部署 → 磁盘级测试（test/test1 两文件夹）→ 提交发布 0.4.4。
- **磁盘级测试**（Obsidian 已关闭）：
  - force push (test) → force pull (test1)：272 md 路径+内容逐字节一致、content diff 0、test 无缺失 ✅
  - 修改文件同步：test 追加内容 → push → pull → hash 一致 ✅
  - 新建文件夹同步：新建 `goal-test-folder/sub`（2 md）→ 同步到 test1 ✅
  - 删除文件夹同步：删除 test 中该文件夹 → test1 同步删除 ✅
- **教训（测试环境）**：
  - test1 是独立 vault（name=test1），`ensureRootFolder` 会找 `_vault_test1`；要让它镜像 test 的数据，需把 test1 `data/mapping.json` 的 `rootFolderId` 指向 test 的根（`99bc4b41...`）再 pull。这是多 vault 插件的固有行为。
  - 同一账号服务器有历史污染（重复 title 的遗留 note，如 `psenger-agentic-skeleton-SKILL (1498005)`），pull 会按 id 后缀去重，非新代码 bug。
  - 磁盘级测试必须关闭 Obsidian（已再次验证）。
- **发布内容（0.4.4）**：
  - DeltaPuller 两段式拉取：先读 delta 元数据 → 并行 5 批量下载变更内容（1000+ 项 15+ 分钟 → <30s）；删除 id 并行验证后再本地应用（`applyDelete` → `applyDeleteLocal`）。
  - JoplinServerApi：每请求 120s 超时（race requestUrl，防连接卡死 wedged sync）、429/5xx/网络错误退避重试、任意 attempt 401 自动重登。
  - 新增 `test/delta-pull-verify.ts`（mock-server 端到端：initial sync + 增量 delta pull + 删除传播，CONSISTENT ✅）+ `test/mock/obsidian-dp.ts`（补 Modal shim）。
- **⚠️ 遗留**：`test/delete-guard.test.ts` 调用已重命名的 `applyDelete`（旧 API），未接任何 runner——重命名后过期未更新，删除守卫行为由 delta-pull-verify 覆盖。
- **发布**：tag `0.4.4`（无 v）push 触发 GitHub Actions 自动 release（assets: main.js/manifest.json/styles.css）。已部署 6 个 vault（下载/test、下载/test1、文档/Obsidian Vault、文档/test、文档/test1、wk）。插件已注册 obsidian-releases，市场机器人自动检测新版本（1-2h 内生效）。
- commit：`055a822`。

### 2026-08-10 joplin-sync-single-vault 新插件（一个账号 = 一个 vault）

- **定位**：与 obsidian-joplin-server-sync（多 vault 隔离）互补。单库语义：一个账号只对应一个 vault。
- **核心差异**：无 `_vault_<name>` 根文件夹、无 belongsToRoot 隔离；force push 删除服务器**全部**内容（仅保留 info.json + master keys）；force pull 拉取服务器全部平铺到当前 vault。
- **实现**：`ensureRootFolder` 返回空串（内容直接挂服务器根 parent_id=''）；forcePush reset/cleanup 无 foreign 保护；forcePull 无 root 过滤；verifycount 对比服务器全部。
- **发布**：repo `yanqingwang/obsidian-joplin-sync-single-vault`，tag `0.1.0`（不带 v）。
- **验证**：CLI forcePush（wiped 1410 保留 1）→ verifycount PASS（1 note + 2 folders + 1 resource 平铺）；forcePull 恢复本地一致。
