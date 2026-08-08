# OpenCode 工作日志（微信云托管 / 小程序）

> 记录 2026-08-08 微信云托管 + 小程序开发/部署的 OpenCode 会话关键节点
> 完整会话记录在 ~/.local/share/opencode/opencode.db

## 会话信息
- 主会话: ses_0fbb2f7aaffe1Pn28C0CONiENz（3803 条消息，2026-06-26 ~ 2026-08-08）
- 辅助会话: ses_0aa09896bffeU84GgsnCtDsNGR（2349 条，2026-07-12 ~ 2026-08-08）

## 2026-08-08 工作节点（本次微信项目开发）
1. **MySQL 迁移**：环境变量配置（USE_MYSQL=true, MYSQL_ADDRESS=10.34.102.54:3306）
   - 重置 root 密码为 Hmxlhen6DKQ（纯字母数字避免 URL 解析问题）
   - 自动建库建表（CREATE DATABASE IF NOT EXISTS + db.create_all()）
2. **多用户隔离**：dao.py local_id 查询加 user_id 过滤
3. **微信登录**：网页端公众号登录 → 微信登录（MicroMessenger UA 检测）
4. **功能修复**：移除示例数据、备份到系统文件、签到日期选择+改期日志
5. **密钥处理**：小程序代码上传密钥重置（41001 错误排查）、AppSecret 更新
6. **部署**：后端推送自动部署（8b9183c）+ 小程序 2.3.0~2.3.5 上传
7. **智能合并**：usedTimes 取大值 + 字段级 LWW + 冲突标记
8. **记录级比对**：diffLocalCloud 差异检测 + 同步方向确定
9. **生命周期同步**：onShow 拉取 / onHide 推送
