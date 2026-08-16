# 任务列表
位于AITasks目录。

# Memory Store

依据 `work.md` 记忆协议管理。

**协议核心**：每次任务后记录一条记忆，间隔重复调度，主动提问式回忆。

## 文件说明

| 文件 | 用途 |
|------|------|
| `memory_YYYY-MM-DD.jsonl` | 每日记忆日志（JSONL格式，每条一行） |
| `memory_archive.jsonl` | 已遗忘/归档的长期记忆 |
| `README.md` | 本文件 |

## 记录格式

```json
{
  "id": "mem_YYYYMMDD_xxx",
  "content": "关键信息摘要（≤300字）",
  "task_type": "任务类型",
  "user_intent": "用户原始意图",
  "timestamp_created": "ISO 8601",
  "last_recall": "ISO 8601",
  "next_recall_due": "下次回忆时间",
  "interval_days": 1,
  "ease_factor": 2.5,
  "recall_count": 0,
  "fail_count": 0
}
```

## 当前记忆

### 2026-08-15
1. **joplin-server-sync v0.4.4 发布** — 并行 delta-pull + 请求超时重试；tag 0.4.4 触发 GitHub Actions 自动 release，部署 6 vault；磁盘级测试（force push/pull、修改/新建/删除文件夹同步）全部通过
2. **多 vault 镜像测试教训** — test1 镜像 test 需手动将 mapping rootFolderId 指向 test 根；服务器历史污染按 id 后缀去重

### 2026-06-01
1. **Agent Skills 采集** — 搜索下载24个主流agent skills文件到AIReports/agent/，含README索引
2. **AI Agent Top30报告** — 生成全球（中国+非中国）Top30+主流Agent研究报告
3. **HR AI数据安全报告** — 基于C1-C4四级分类的HR AI应用全景+6个实际案例
