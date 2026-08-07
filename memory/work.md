
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

---

## 2026-08-01 Card-Counter 小程序云开发版改造记录

### 背景与根因
小程序（奶爸的那些事，AppID `wx9c5974ab24d057c3`）原本用 **web-view** 加载 Flask 云托管（`https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/`），线上 1.0.1 无法访问该链接。
**根因**：web-view 的**业务域名必须 ICP 备案**，腾讯云托管共享域名（`*.tcloudbase.com`）无法备案，无法配置为业务域名。

### 解决方案：云开发模式（v2.0.0）
放弃 web-view，重写为**原生小程序 UI + `wx.cloud.callContainer` 调用 Flask 云托管**：
- `wx.cloud.callContainer` 免配置业务域名，微信自动注入 `X-WX-OPENID` 头识别用户
- Flask 后端 `/api/auth/wechat-login` 读取 `X-WX-OPENID` 自动登录（无需修改后端）

### 关键配置
| 项 | 值 |
|----|-----|
| 云托管环境 ID | `prod-d5gm4a2q00a7f9209` |
| 云托管服务名 | `flask-z9hh` |
| Flask 公网地址 | `https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/` |
| 调用方式 | `wx.cloud.callContainer({config:{env}, path, header:{'X-WX-SERVICE':'flask-z9hh'}, ...})` |
| 请求域名白名单 | request: `https://card-counter.8.130.118.200.sslip.io` |
| 代码上传 IP 白名单 | `5.226.50.86`、`103.190.179.55`、`117.185.175.253` |
| 代码上传密钥 | private.key（本机 `/home/wang/wk/code/card-counter-miniapp/private.key`） |

### 小程序代码结构（v2.0.0）
- `app.js` — 云开发初始化 + `callApi()` 封装（401 自动重登录）+ 微信自动登录
- `pages/index` — 配额列表（汇总卡片/进度条/下拉刷新/FAB 新增）
- `pages/quota` — 新增/编辑/删除配额
- `pages/checkin` — 签到消费（选次卡/扣减次数/最近记录）
- `pages/profile` — 个人中心（用户信息/数据统计）

### Flask 后端 API（wxcloudrun-flask）
- `/api/auth/wechat-login`（GET，读 X-WX-OPENID）、`/api/auth/me`、register/login/profile/change-password
- `/api/quotas`（CRUD，含 local_id 去重）、`/api/checkins`（+revoke）、`/api/ratings`
- 认证：JWT Bearer token；数据模型：User/Quota/Checkin/Rating

### 上传/发布经验
1. **miniprogram-ci 上传**：`node upload_ci.js`（version 2.0.0），需 IP 白名单含本机出口 IP
2. **IP 白名单坑**：本机 IPv6（`2409:8a1e:4d26:a631::e6a`）无法加入白名单 → **关闭路由器 IPv6** 后走 IPv4（`103.190.179.55`）成功
3. **提交审核**：版本管理 → 开发版本 → 提交审核 → 勾选协议（React 受控 checkbox 需 click() 触发）→ 处理"接口未配置"+"安全测试"弹窗 → 审核中
4. **体验版**：需在版本管理将开发版本"设为体验版"，体验成员微信扫码访问（非 URL）

### 当前状态（2026-08-01）
- 线上版本：1.0.1（旧 web-view 版）
- 审核中：2.0.0（云开发版，2026-08-01 20:34 提交，预计 1-7 天）
- 审核通过后需在"审核版本"点击发布

### 相关文件
- 小程序代码：`/home/wang/wk/code/card-counter-miniapp/`
- Flask 后端：`/home/wang/wk/code/card-counter-flask/`
- 上传脚本：`/tmp/upload_ci.js`
- 任务文档：`AITasks/Product - Card_count*.md`、`AITasks/小程序云托管开发.md`

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
- **同步日志明细**：SettingsTab 的 Sync history 表增加 新建/更新/删除 列（v0.3.69）
- **验证**：真实 test → test1 增量同步 13/13 PASS（文件 修改/新建/删除/重命名/移动 + 文件夹 重命名/删除/移动）；全量 178 文件 + 31 目录 0 差异