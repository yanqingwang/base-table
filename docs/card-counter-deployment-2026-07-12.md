# 次卡管家 — 部署文档

> 日期：2026-07-12
> 版本：v1.1
> 状态：V2 CloudBase SPA ✅ 已上线 | V3 小程序密钥 ✅ 已生成

---

## 一、环境概览

| 项目 | 值 |
|------|------|
| 腾讯云环境 ID | `cardcount-d4gjfjexz3097d803` |
| 云套餐 | 体验版（免费至 2027-01-12） |
| 数据库实例 | `tnt-8qawvuzj2`（上海） |
| 小程序 AppID | `wx9c5974ab24d057c3` |
| 小程序名称 | 心和路 |

---

## 二、部署方式

### 方式 1：本地 Python 服务器（V1）

```bash
cd code/card-counter
python3 server.py
# 访问 http://localhost:8080
# 数据存储于 data/cards.json
```

适合本地测试和离线使用。

### 方式 2：CloudBase 静态托管（V2）— ✅ 已部署

```bash
# 前端代码
code/card-counter-cloud/index.html

# 部署位置
CloudBase 静态托管
默认域名：https://cardcount-d4gjfjexz3097d803-1363172352.tcloudbaseapp.com

# 部署命令 (CLI)
npx tcb hosting deploy . -e cardcount-d4gjfjexz3097d803

# 当前状态：已上线，浏览器可直接访问
```

### 方式 3：微信小程序（V3）— web-view 包装版

项目位置：`code/card-counter-miniapp/`

**架构说明：**
- 小程序本身仅包含一个 `web-view` 页面，加载 CloudBase 静态托管 URL
- 实际业务逻辑全部在 CloudBase SPA 中运行
- 因此发布小程序 = 将 CloudBase URL 包装后提交微信审核

**上传密钥状态：** ✅ 已生成并下载（`private.key`）

**推荐部署方式（云端）：**
1. 使用 [CloudBase 云端部署](https://cloud.tencent.com/solution/la) — 通过控制台直接管理
2. 或使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)：
   - 打开项目，选择 `code/card-counter-miniapp/` 目录
   - AppID：`wx9c5974ab24d057c3`
   - 点击"上传"提交至微信平台
3. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 版本管理 → 提交审核
4. 审核通过后发布

**注意：**
- ⚠️ 小程序备案（ICP 备案）还未完成，上架前必须先完成备案
- 本地 `miniprogram-ci` CLI 上传需要将当前机器 IP 加入微信 IP 白名单
  - 控制台路径：mp.weixin.qq.com → 开发管理 → 开发设置 → IP 白名单
  - 当前机器 IPv4：`45.137.183.193`（已添加）
  - 如 IP 变更需重新配置

---

## 三、数据库集合

| 集合名 | 状态 | 权限 |
|--------|------|------|
| `quotas` | ✅ 已创建 | 读取全部，修改本人 |
| `checkins` | ✅ 已创建 | 读取全部，修改本人 |
| `ratings` | ❌ 未创建 | 需手动在 CloudBase 控制台创建 |

创建方法：CloudBase 控制台 → 文档型数据库 → 新建集合 → 名称 `ratings` → 权限"读取全部数据，修改本人数据"

---

## 四、域名白名单

小程序 web-view 需要将以下域名加入白名单：

| 域名 | 用途 |
|------|------|
| `cardcount-d4gjfjexz3097d803-1363172352.tcloudbaseapp.com` | 静态托管 |
| `api.tcb.tencentcloudapi.com` | CloudBase API |

配置路径：mp.weixin.qq.com → 开发管理 → 开发设置 → 服务器域名

## 五、IP 白名单（CLI 上传用）

使用 `miniprogram-ci` CLI 上传时需将本机 IP 加入白名单：

| IP | 类型 | 状态 |
|-----|------|------|
| `45.137.183.193` | IPv4 | ✅ 已添加 |

路径：mp.weixin.qq.com → 开发管理 → 开发设置 → IP 白名单

**注意**：微信管理后台仅支持 IPv4 格式。如机器 IPv6 优先，上传时需强制走 IPv4（CLI 需 `--proxy` 或配置 `HTTPS_PROXY` 环境变量）。推荐直接使用微信开发者工具 GUI 上传或 CloudBase 云端部署。

---

## 六、本地开发环境

### 前置要求

- Python 3.10+
- Node.js 18+
- CloudBase CLI：`npm install -g @cloudbase/cli`

### 项目结构

```
code/
├── card-counter/           # V1：本地 Python 版
│   ├── server.py           # HTTP 服务器
│   ├── index.html          # 前端页面
│   └── data/               # 数据存储目录
├── card-counter-cloud/     # V2：CloudBase 云版
│   ├── index.html          # 完整 SPA 前端
│   └── cloudbaserc.json    # 部署配置
└── card-counter-miniapp/   # V3：微信小程序
    ├── app.json            # 小程序配置
    ├── project.config.json # 项目配置
    └── pages/index/        # web-view 页面
```

---

## 七、注意事项

1. **费用**：当前使用体验版（免费），2027-01-12 到期
2. **数据安全**：体验版数据库无自动备份，建议定期导出数据
3. **小程序备案**：发布前必须先完成小程序备案
4. **ratings 集合**：需要手动在 CloudBase 控制台创建
5. **静态托管免费额度**：2GB 存储 + 每月一定流量，超出可能需要付费
