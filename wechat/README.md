# 微信项目工作区（wechat/）

集中管理微信云托管、小程序（次卡管家）相关的**工作日志、记忆、任务、产出**，避免与其他项目（Joplin Sync、NoteForge、HRIS 等）互相干扰。

## 目录结构

| 目录 | 内容 | 来源 |
|------|------|------|
| `memory/` | 工作记忆 | 从 `wk/memory/work.md` 抽取的微信章节 + wechat-publisher 记忆 |
| `tasks/` | 任务文档 | 从 `wk/AITasks/` 复制的微信相关任务 |
| `logs/` | OpenCode 工作日志 | 本次会话关键节点记录 |
| `docs/` | 产出文档 | 从 `wk/AIReports/wechat/` 复制的产出 |

## 约定

1. **后续微信/小程序开发记录统一写** `wechat/memory/work.md`（不再追加到 `wk/memory/work.md`）
2. **代码仓库保持原位**（不移动）：
   - 后端：`code/card-counter-flask`
   - 小程序：`code/card-counter-miniapp`
   - 云开发/云托管脚本：`code/card-counter-cloud`、`code/card-counter-cloudrun`
   - 公众号发布工具：`code/wechat-publisher`
3. **OpenCode 工作日志**：关键节点记录到 `wechat/logs/`，完整会话在 `~/.local/share/opencode/opencode.db`

## 快速参考（部署机制）

### 当前版本状态（2026-08-08，最新 v2.4.8）
- 网页（云托管）：线上已含全部 v2.4.x 功能（最新 v2.4.8：修改签到支持备注+日期编辑）
- 小程序：v2.4.0~v2.4.8 均已上传开发版但**从未发布**；**待办 = 发布 v2.4.8**（mp.weixin.qq.com → 版本管理 → 提交审核 → 发布）
- 完整版本总览 + 部署命令 + 两仓库陷阱 → 见 `memory/work.md` 顶部「📌 快速开始」

### 云托管后端部署
```bash
cd code/card-counter-flask
git push origin main   # 自动触发云托管构建（GitHub 被墙时开代理）
```

### 小程序上传
```bash
cd code/card-counter-miniapp
NODE_PATH=$(npm root -g) node scripts/upload_ci.js <版本> "<描述>"
# 前置检查: private.key md5 = ff454fb9... + 出口 IP 在白名单
```

### 关键账号/密钥
- AppID: `wx9c5974ab24d057c3`
- AppSecret: `a0e445acf3ab7758c8c26a88de7dfcbe`（2026-08-08 重置）
- MySQL: 内网 `10.34.102.54:3306` / 库 `card_counter` / root 密码见 memory/work.md

详见 `memory/work.md` 完整记录。
