# DocuSign DEV 工作任务报告

**报告日期**: 2026年06月13日  
**项目**: 模板迁移与批量发送能力建设  
**环境**: DEV (demo.docusign.net) / PRD (eu.docusign.net)  

---

## 一、任务概述

将 PRD 生产环境的 `MY_Offer_Laird_Bulk_Send(1)` 模板完整迁移至 DEV 开发环境，实现：
1. 所有字段完整迁移（148 个标签 + 14 个 DocGen 字段）
2. 在线文档生成（DocuSign DocGen）
3. 批量发送能力（通过 XLSX/CSV 数据导入）
4. 预填 + 签署双角色流程（方法二）
5. PRD 模拟测试（创建→验证→作废，不真实发送）

---

## 二、模板迁移

### 2.1 模板复制

| 项目 | PRD 源 | DEV 目标 |
|------|--------|---------|
| 模板名称 | MY_Offer_Laird_Bulk_Send(1) | MY_Offer_Laird_Bulk_Send-DEV |
| 模板 ID | e24aadfa | **22ed2f15**（最终版） |
| 账户 | 694285719 (TE-Malaysia) | 45444181 (TE-MY) |
| 环境 | eu.docusign.net | demo.docusign.net |

### 2.2 文档结构

5 个文档，顺序为：

| 顺序 | 文档名称 | 类型 | 说明 |
|------|---------|------|------|
| 1 | MY_Offer_Laird_Bulk_Send.docx | DOCX (DocGen) | Offer Letter，含14个合并字段 |
| 2 | MY_Onboarding_Notice_Collection_of_Personal_Data_Laird.pdf | PDF | 个人信息收集通知 |
| 3 | MY_Onboarding_Employee_Acknowledgement-C_Laird.pdf | PDF | 员工确认书 |
| 4 | MY_Onboarding_Attachment_Collection_Laird.pdf | PDF | 附件采集 |
| 5 | MY_Onboarding_Employee_Profile_Form_Laird.pdf | PDF | 员工信息表 |

### 2.3 标签结构

| 角色 | 标签数量 | 标签类型 |
|------|---------|---------|
| HR Manager | 1 | signHereTabs |
| Employee | 148 | textTabs(92), listTabs(29), dateTabs(7), numberTabs(2), radioGroupTabs(3), signHereTabs(5), signerAttachmentTabs(2), fullNameTabs(4), dateSignedTabs(4) |

### 2.4 DocGen 字段

Offer Letter 文档含 14 个 DocuSign Document Generation 合并字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| REQ_ID | TextBox | 需求编号 |
| Initiate_Date | Date | 发起日期 (DD/MM/YYYY) |
| Employee_Full_Name | TextBox | 员工全名 |
| Identification_Card_Number | TextBox | 身份证号码 |
| Employee_Home_Address | TextBox | 家庭地址 |
| Job_Title | TextBox | 职位 |
| Band_Level_Role | TextBox | 职级 |
| Effective_Date | Date | 生效日期 |
| Currency | Select (MYR/USD) | 币种 |
| Monthly_Basic_Salary | Number | 月基本薪资 |
| Incentive_Rate | TextBox | 激励比例 |
| Probation_Period | TextBox | 试用期（月） |
| Month_s_Notice_Confirmed | Select (1/2) | 确认通知月数 |
| Month_s_Written_Notice | Select (1/2) | 书面通知月数 |

---

## 三、关键技术问题与解决

### 3.1 DOCX 合并字段拆分问题

**问题**: 用户提供的 DOCX 文件中，14 个合并字段被 Word 拆分到多个 XML `<w:r>` run 中，导致 DocuSign DocGen 引擎无法识别。

**解决**: 使用 LibreOffice 重新处理 DOCX（`libreoffice --headless --convert-to docx`），所有字段变为连续文本。

**验证**: `python3 -c "import zipfile; ..."` 确认 14 个 `{FieldName}` 全部为连续文本。

### 3.2 DocGen 字段值无法通过 API 设置

**问题**: DocuSign API 不支持在创建信封时设置 `docGenFormFields` 值。`PUT /envelopes/{id}` 和 `PUT /envelopes/{id}/docGenFormFields` 均无法持久化字段值。

**解决**: DocGen 字段必须通过 Web UI 的 add-genforms 页面填写。API 仅负责：创建信封 → 设置收件人 → 设置标签 → 发送。已通过 CDP 自动化验证 add-genforms 页面正常工作（14/14 字段填入）。

### 3.3 模板 HR Manager 角色固定邮箱

**问题**: 从 PRD 复制的模板中 HR Manager 角色有固定邮箱 `shaiim.chuah@te.com`，导致创建信封时出现重复收件人。

**解决**: 在创建模板时提前清除 HR Manager 的 `name`/`email`/`userId` 字段，使其成为通用角色。

### 3.4 文档顺序调整

**问题**: 用户要求的文档顺序为 Offer → Notice → Ack → Attachment → Profile，但模板默认顺序不同。

**解决**: 在创建模板时通过 `doc_order` 字典对文档列表重新排序，确保按用户要求排列。

---

## 四、脚本清单

### 4.1 DEV 环境脚本

| 脚本 | 位置 | 说明 |
|------|------|------|
| `send_laird_test.py` | DEV/ | **主发送脚本**。支持 --xlsx/--csv/--dry-run/--index N。处理 3 种列前缀 (HR Manager::, Employee::, Document Generation::)，自动识别标签类型，支持手机号 |
| `send_esign_method2.py` | DEV/ | **方法二脚本**。双角色预填流程：HR Manager 路由 + Employee 预填+签署。9 个字段 locked=true |

### 4.2 PRD 环境脚本

| 脚本 | 位置 | 说明 |
|------|------|------|
| `simulate_test.py` | PRD/ | **模拟测试脚本**。创建信封(status=created)→验证结构→立即作废，从不发送 |
| `docusign_copy_to_dev.py` | PRD/ | **模板复制脚本**。从 PRD 复制模板到 DEV，含 DocGen 元数据转发 |

### 4.3 数据文件

| 文件 | 说明 |
|------|------|
| `Sample-Bulk-Recipient.xlsx` | **批量发送数据模板**，113 列（5 HR:: + 94 Employee:: + 14 Document Generation::） |
| `laird_test_batch.csv` | 测试用 CSV，与 xlsx 结构一致 |

---

## 五、功能测试结果

### 5.1 Web UI 流程测试

| 测试项 | 结果 | 证据 |
|--------|------|------|
| add-genforms 页面加载 | ✅ 正常 | HTTP 200，显示全部 14 个字段 |
| 字段填写 | ✅ 正常 | 14/14 字段填入值 |
| Next 按钮 | ✅ 正常 | 跳转至 add-fields 页面 |
| 文档预览 | ✅ 5 个文档全部可见 | |
| 发送 | ✅ 成功 | status=sent |

### 5.2 API 发送测试

| 信封 ID | 方式 | 标签 | DocGen | 收件人 | 状态 |
|---------|------|------|--------|--------|------|
| 94e9234c | XLSX 批量 | 36 | 14（需 UI 填写） | HR+Emp = wangyantsing@qq.com | ✅ sent |
| f22420d0 | 内置样本 | 107 | 14 | wangyantsing@qq.com | ✅ sent |
| 9911218e | 方法二预填 | 9+148 | - | wangyantsing@qq.com | ✅ sent |

### 5.3 PRD 模拟测试

| 测试项 | 结果 |
|--------|------|
| 创建信封 (status=created) | ✅ |
| 验证结构（148 标签 + 1 签名） | ✅ |
| 立即作废 (status=voided) | ✅ |
| 从未实际发送 | ✅ |

---

## 六、模板信息汇总

### 最终模板

| 属性 | 值 |
|------|-----|
| 模板 ID | `22ed2f15-abf2-4753-8fe0-3141d87418c6` |
| 名称 | MY_Offer_Laird_Bulk_Send-DEV |
| Account ID | 45444181 |
| isDocGenTemplate | true |
| 文档数 | 5 |
| Employee 标签 | 148 |
| DocGen 字段 | 14 |
| HR Manager | 通用角色（无固定邮箱） |

### 访问方式
- **API 发送**: `python3 DEV/send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --status sent`
- **Web UI**: 登录 `https://apps-d.docusign.com` → 模板 → MY_Offer_Laird_Bulk_Send-DEV → 使用

---

## 七、已知限制

1. **DocGen 字段值**: API 无法预填 DocGen 合并字段值，需通过 Web UI 的 add-genforms 页面操作
2. **文档顺序**: 信封中文档按模板的 `order` 值排序，API 返回的 `documentId` 不直接对应显示顺序
3. **历史信封清理**: ~221 个测试信封仍存在 DEV 环境（API 批量删除超时），建议在 Web UI 中清理
4. **字段标签修改**: Identification Card Number 示例文字、Probation Period (Months) 等需在 Web UI 模板编辑器中手工操作

---

## 八、使用指南

### 批量发送
```bash
cd /home/wang/wk/code/docusign-keys/DEV

# 通过 xlsx 批量发送
python3 send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --status sent

# 通过 csv 批量发送
python3 send_laird_test.py --csv laird_test_batch.csv --status sent

# 干运行验证
python3 send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --dry-run

# 方法二：预填+签署
python3 send_esign_method2.py

# PRD 模拟（不发送）
cd ../PRD && python3 simulate_test.py
```

### 常见问题
- **"Something went wrong"**: 检查使用的模板是否为新模板（ID: 22ed2f15）
- **DOCX 合并字段不替换**: 需要在 Web UI 的 add-genforms 页面填写字段值
- **重复收件人**: 检查模板中 HR Manager 是否有固定邮箱

---

## 九、相关工作记忆

已记录至 `memory_2026-06-12.jsonl`（13 条）和 `memory_2026-06-13.jsonl`（13 条），涵盖全部里程碑、配置变更、测试结果和功能特性。
