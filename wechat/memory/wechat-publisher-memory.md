# 微信公众号发布工具 - 工作记忆

## 公众号信息
- **名称**: 心和路
- **AppID**: `wx6a8321a707ccce6d`
- **AppSecret**: `54d8dae7adf1360dbeac4001758df4d0` (已生成，注意安全)
- **IP白名单**: `223.166.226.86`, `117.185.175.139`
- **类型**: 个人订阅号（未认证）
- **管理员**: Ross (wangyantsing@qq.com)

## 发布工具
- **路径**: `/home/wang/wk/code/wechat-publisher/`
- **脚本**: `publish_wechat.py`
- **配置**: `.env` (已含 AppID/AppSecret)
- **默认封面**: `default_cover.jpg` (绿色背景 + "探寻生命的意义")

### 脚本能力
- Markdown → 微信公众号 HTML (支持标题/粗体/表格/引用/分割线)
- 本地图片自动上传到微信CDN (支持标准 `![]()` 和 Obsidian `![[ ]]` 格式)
- 自动提取首图作为文章封面
- 自动生成摘要
- 封面图自动上传
- 草稿创建/更新/发布

### 使用命令
```bash
# 创建草稿
python publish_wechat.py --file <path>

# 更新已有草稿
python publish_wechat.py --file <path> --update <media_id>

# 直接发布
python publish_wechat.py --file <path> --publish
```

### API限制（个人订阅号）
- 标题: 最多13个中文字符（API限制比文档更严格）
- 摘要: 最多20个中文字符
- 正文: 最多20,000字符
- 需要 `thumb_media_id`（封面图必须上传为永久素材）

### 编码注意事项
- ❌ `requests.post(json=payload)` → 自动 `ensure_ascii=True`，中文变 `\uXXXX` 乱码
- ✅ 必须手动 `json.dumps(payload, ensure_ascii=False)` + `Content-Type: application/json; charset=utf-8`

## 文章资源
### 研究报告
- **完整报告**: `AIReports/探寻生命的意义-2026-06-20.md` (21,671字)
- **研究笔记**:
  - `AIReports/探寻生命的意义/research-notes-historical.md` (历史观念)
  - `AIReports/探寻生命的意义/research-notes-contemporary.md` (当代多元化)
  - `AIReports/探寻生命的意义/research-notes-guidance.md` (引导框架+中年路径)
- **综合分析**:
  - `synthesis-universal-meaning.md` (普遍意义综合)
  - `synthesis-guidance-midlife.md` (引导框架+路径综合)

### 公众号文章系列
- **目录**: `AIReports/探寻生命的意义/公众号系列/`
- **每日短文** (day-1 到 day-8)：每篇400-700字，活泼有趣风格
- **合并版**: `merged-full.md` / `all-in-one.md`
- **文章合集**: `AIReports/探寻生命的意义/文章合集.md` (7篇详细版)
- **发布计划**: `发布计划.md` (8天排期+策略)

### 文章结构 (all-in-one)
1. 开篇：价值在哪里？emo有想过吗
2. 希腊哲学家：亚里士多德的故事
3. 选择迷茫：选择的悖论
4. 意义密码：三大共核（关系、超越、本事）
5. 自测：5个简单问题
6. 行动：三件小事（好事日记、正念喝水、联系朋友）
7. 中年人：老张的故事（输出比积累重要）
8. 收尾：七句话总结

## 当前状态
- 草稿箱：已清空
- 待发布：all-in-one.md 已合并但未上传
- 用户指示：暂停所有操作，等后续处理
