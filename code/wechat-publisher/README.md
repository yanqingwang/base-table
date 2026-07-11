# 微信公众号发布工具

一键将 Markdown 文章发布到微信公众号草稿箱。

## 快速开始

### 1. 安装依赖

```bash
cd /home/wang/wk/code/wechat-publisher
pip install requests python-dotenv
```

### 2. 配置公众号

1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com/)
2. 进入 **设置与开发 → 基本配置**
3. 获取 **AppID** 和 **AppSecret**
4. 将你的服务器/本机出口 IP 加入 **IP 白名单**
5. 复制 `.env.example` 为 `.env`，填入 AppID 和 AppSecret

### 3. 发布文章

**存为草稿（推荐先试）：**
```bash
python publish_wechat.py --file "../../AIReports/探寻生命的意义-2026-06-20.md"
```

**直接发布：**
```bash
python publish_wechat.py --file "../../AIReports/探寻生命的意义-2026-06-20.md" --publish
```

**发布文章合集中的某一篇：**
```bash
python publish_wechat.py --file "../../AIReports/探寻生命的意义/文章合集.md" --title "古代先贤怎么看生命的意义？"
```

**配置验证（不会实际发布）：**
```bash
python publish_wechat.py --file "../../AIReports/探寻生命的意义-2026-06-20.md" --dry-run
```

## 可发布内容

| 文件 | 说明 | 建议发布方式 |
|------|------|------------|
| `AIReports/探寻生命的意义-2026-06-20.md` | 完整研究报告（约10,000字） | 单篇发布，附加"阅读原文"链接至完整报告 |
| `AIReports/探寻生命的意义/文章合集.md` | 7篇独立文章合集 | 逐篇发布为系列连载（每周1-2篇） |

## 手动发布（备用方案）

如果 API 方式不便，也可以：
1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com/)
2. 进入 **草稿箱 → 新建图文**
3. 手动粘贴文章内容
4. 设置封面、摘要后发布

## 注意事项

- access_token 有效期为2小时，脚本已自动缓存
- 草稿箱中的素材发布后会被移除（保留发布记录）
- 正文最多20,000字符
- 封面图建议 900×500 像素
- 图片需先上传至公众号图床（脚本自动处理外链图片）
