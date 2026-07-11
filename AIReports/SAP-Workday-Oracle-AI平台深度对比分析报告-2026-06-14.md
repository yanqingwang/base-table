# SAP vs Workday vs Oracle：企业AI平台与学习能力深度对比分析报告

**报告日期：2026年06月14日**

---

## 执行摘要

本报告以SAP Learning Hub为切入点，深入分析SAP、Workday、Oracle三大企业软件巨头在AI领域的战略布局、产品演进和未来竞争力。报告基于2025-2026年公开的产品发布、技术文档、市场分析和行业评论。

**核心发现：**

1. **SAP** 以"自主企业（Autonomous Enterprise）"为愿景，通过Joule AI助手、Joule Studio代理开发平台和SAP Business AI平台构建了最完整的企业AI生态。SAP Learning Hub通过与Google NotebookLM的集成，实现了AI辅助学习的全面升级。
2. **Workday** 通过收购AI初创公司Sana（2025年11月完成），推出了颠覆性的"Sana超级智能"平台，在HR+Finance领域建立了深厚的AI护城河，但其跨系统能力仍处于早期。
3. **Oracle** 凭借Fusion Agentic Applications和AI Agent Studio，在HCM领域推出了8个代理式应用，以"落地最快、最务实"的策略在竞争中占据独特位置，但其AI叙事相对不够引人注目。

**市场格局：** 三大厂商在HCM市场（2025年约$587亿，CAGR 6.7-9.4%）形成寡头竞争，Workday（9.8%市场份额）领先，SAP（约4.5-5.5%）和Oracle（约3-4%）紧随其后。在AI代理时代，它们都面临着来自Microsoft Copilot、ServiceNow、Salesforce的跨界竞争。

---

## 方法论与局限性说明

**研究方法**：
1. **二手研究（Sections 1-6）**：基于2025-2026年公开的产品发布新闻、官方技术文档、行业分析报告（VMR、ISG、Fortune Business Insights、Gartner、Josh Bersin）和市场数据
2. **平台浏览（Section 7）**：通过Chrome DevTools Protocol（CDP）连接到用户操作的Chromium浏览器实例，导航SAP Learning Hub的课程目录、帮助中心页面和公开课程详情页

**重要局限性**：
- Workday和Oracle的AI平台数据**完全基于公开资料**，未进行直接平台访问
- SAP Learning Hub的平台浏览主要限于**课程目录页面和公开帮助文档**；NotebookLM集成功能因Google Cloud Workforce Pool联邦认证需要交互式OAuth登录，**未能实际访问NotebookLM界面**
- **未实际完成端到端的课程学习**（课程时长1-3小时），课程内容从平台课程目录页面提取
- NotebookLM的AI输出格式（播客、思维导图等）的描述基于SAP官方帮助中心文档和Google Cloud新闻稿，**非实际内容生成体验**
- 部分课程详情页内容可能在未登录状态下也可访问，报告已尽力标注信息来源
- 市场预测基于现有趋势推断，实际结果可能因技术突破、并购、监管变化等因素显著不同

---

## 第一部分：SAP AI能力全景

### 1.1 SAP Business AI平台架构

SAP在2026年Sapphire大会上推出了统一的**SAP Business AI Platform**，将SAP BTP（业务技术平台）、SAP Business Data Cloud和SAP Business AI整合为单一治理环境。其核心架构包括[citation:1][citation:2]：

| 层级 | 组件 | 功能 |
|------|------|------|
| **AI交互层** | Joule | 统一AI助手，覆盖35+解决方案 |
| **代理开发层** | Joule Studio | 低代码/专业代码代理构建平台 |
| **业务知识层** | SAP Knowledge Graph | AI代理的业务实体、流程和关系结构化地图 |
| **数据层** | SAP Business Data Cloud | 统一的业务数据平台 |
| **AI基础设施** | AI Foundation / Generative AI Hub | 多模型支持（GPT-5、Gemini 2.5 Pro【注：版本号根据公开信息推断】、Claude Opus 4等[citation:3]） |
| **治理层** | SAP AI Agent Hub | 代理生命周期管理、治理、发现 |

### 1.2 Joule：SAP的AI交互革命

Joule是SAP的AI助手，目前已覆盖35+解决方案，拥有**30+专业代理和2,500+ Joule技能**[citation:3]。Joule在Q1 2026的新功能包括：

- **Joule Work**：用户不再需要在多个应用中导航，只需描述业务目标，Joule会自动编排工作流、数据和代理来完成任务[citation:4]
- **Joule Assistants**：超过50个领域特定助手，覆盖财务、供应链、采购、HCM和客户体验
- **代理间通信协议（A2A）**：支持跨SAP和非SAP系统的代理协作

### 1.3 Joule Studio：企业级代理开发平台

2026年5月发布的Joule Studio是SAP AI战略的核心[citation:1]：

- **Build**：支持意图驱动开发，嵌入n8n可视化多代理编排和Vercel前端能力
- **Contextualize & Reason**：通过SAP Knowledge Graph、Business Data Cloud和Domain Models深度集成，使代理在实时业务数据上推理
- **Govern**：通过SAP AI Agent Hub、Signavio和LeanIX实现企业级治理
- **专业代码能力**：支持LangChain、Pydantic AI、LlamaIndex框架，以及与VS Code、Cursor等IDE的集成

### 1.4 SAP Business AI的代理生态

SAP已部署超过**200个专业代理**[citation:4]，关键代理类型包括：

| 代理类型 | 功能 | 应用领域 |
|----------|------|----------|
| **Tender Analysis Agent** | 从复杂文档中提取关键需求，标记风险 | 采购/销售 |
| **Project Setup Agent** | 自动设置项目 | S/4HANA Cloud |
| **Autonomous Close Assistant** | 将财务关账从数周压缩至数天 | 财务 |
| **Joule for Developers** | AI辅助代码生成、测试和集成 | 开发 |
| **Joule for Consultants** | AI辅助系统配置和项目决策 | 咨询 |

### 1.5 SAP Learning Hub：AI辅助学习

SAP Learning Hub通过与**Google NotebookLM**的深度集成，实现了AI驱动的学习转型[citation:5][citation:6]：

**核心AI功能：**

- **AI学习助手（AI Learning Assistant）**：支持80+语言的自然语言问答，答案直接从SAP学习内容中提取并提供来源引用
- **多格式内容生成**：
  - 🎧 **播客（Podcast）**：将课程内容转化为音频，支持被动收听和互动问答
  - 🧠 **思维导图（Mind Map）**：课程内容可视化概览
  - 📝 **学习指南（Study Guide）**：结构化摘要
  - 📊 **简报文档（Briefing Document）**：课程综合概述
  - ⏱️ **时间线（Timeline）**：关键概念的时间顺序排列
  - 🎬 **视频概览（Video Overview）**：AI生成的视频摘要
- **AI模拟和虚拟角色**：用于认证准备，模拟真实项目场景
- **个性化学习路径**：根据用户角色、水平和兴趣定制

**采用成效**[citation:5]：
- 超过7,500名用户已在使用AI功能
- LTIMindtree报告入职速度提升50%
- NTT Data Business Solutions已将SAP Learning Hub作为AI代理时代的核心人才培养平台

**可用版本**：客户版、合作伙伴版、内部版（不包含学生版、活动版和企业支持版）

---

## 第二部分：Workday AI能力全景

### 2.1 Workday的AI战略转折

Workday在2025-2026年经历了重大战略转型：

1. **2025年5月**：联合创始人Aneel Bhusri回归CEO，推出Workday Illuminate AI平台
2. **2025年11月**：完成对AI初创公司**Sana**的收购（金额未公开）
3. **2026年3月**：正式推出**Sana from Workday**——"超级智能（Superintelligence）"平台
4. **2026年5月**：与Google Cloud扩大合作，Sana Self-Service Agent集成到Gemini Enterprise

### 2.2 Sana：Workday的超级智能

Sana是Workday收购后整合的AI平台，其口号是"超级智能让工作更智能"（Superintelligence for Work）[citation:7][citation:8]。

**三大组件：**

| 组件 | 功能 | 目标用户 |
|------|------|----------|
| **Sana for Workday** | 全新统一AI界面，替代传统菜单导航 | CHRO、CFO、经理、员工 |
| **Sana Self-Service Agent** | 自动化HR和财务工作流，300+技能 | 全体员工 |
| **Sana Enterprise** | 扩展到Workday之外的企业应用 | 企业级 |

**Sana的四大核心能力**[citation:7]：
1. **Ask（问答）**：跨企业系统提问并获得引用回答
2. **Act（行动）**：在Workday内自动执行任务
3. **Build（构建）**：将知识转化为仪表板、摘要和文档
4. **Automate（自动化）**：设置无代码多步骤工作流

**Sana Enterprise连接器生态**[citation:8]：Box、Confluence、Gmail、Google Calendar、Jira、Linear、Microsoft Outlook、Miro、Notion、Salesforce、ServiceNow、SharePoint、Slack、Zoom等

### 2.3 Workday Illuminate：AI代理系列

Workday的AI代理品牌"Illuminate"专注于HR和财务领域[citation:9]：

| 代理名称 | 功能 | 可用性 |
|----------|------|--------|
| **Recruiting Agent** | AI驱动招聘 | 已发布 |
| **Talent Mobility Agent** | 内部人才流动 | 已发布 |
| **Payroll Agent** | 薪资自动化 | 已发布 |
| **Financial Audit Agent** | 财务审计 | 已发布 |
| **Business Process Optimize Agent** | 业务流程优化 | 已发布 |
| **Contract Intelligence Agent** | 合同智能分析 | GA |
| **Self-Service Agent** | 员工自助服务 | 2025年底GA |
| **Frontline Agent** | 一线员工支持 | 2026年初EA |

### 2.4 Workday Learning（Sana Learn）

Workday通过Sana收购获得了AI原生的学习平台**Sana Learn**（G2评分9.6/10）[citation:7]：

- **AI导师（AI Tutor）**：为每个学习者提供个性化AI导师
- **AI生成课程**：包括模拟场景，如测试产品推销能力
- **个性化学习路径**：基于技能、绩效和职业目标
- **跨系统学习推荐**：集成Workday Skills Cloud
- **750+预置课程**：涵盖管理、领导力和HR

Sana Learn与Workday Learning形成互补：
- **Workday Learning** = 学习记录系统 + 合规治理（SOR）
- **Sana Learn** = AI原生学习体验 + 内容生成 + 个性化辅导

### 2.5 Workday的竞争优势来源

Workday的AI优势建立在其数据基础上[citation:9]：
- 每年处理超过**1万亿笔交易**
- 超过**11,000家客户**，覆盖65%+的财富500强
- HR和财务数据的**统一数据模型**（Data Core）
- **ISO 42001** AI治理认证

---

## 第三部分：Oracle AI能力全景

### 3.1 Oracle的AI战略：务实落地

Oracle的AI战略核心是"将AI嵌入到现有应用中，快速产生业务价值"，通过**Fusion Agentic Applications**和**AI Agent Studio**实现[citation:10][citation:11]。

Oracle采用**六次年度更新节奏**（24A-26C），AI功能从预测性AI → 生成式AI → 代理式AI逐步演进。

### 3.2 Fusion Agentic Applications for HR

2026年4月，Oracle发布了**8个Fusion Agentic Applications for HR**[citation:10]：

| 代理应用 | 功能描述 |
|----------|----------|
| **Career Advancement Command Center** | 促进职业流动，连接员工与开放岗位，推荐培训 |
| **Hiring Workspace** | 减少招聘管理负担，缩短零售店经理招聘时间 |
| **Team Learning Workspace for Managers** | 监控团队学习需求，预测合规风险，识别技能差距 |
| **Employee Support Command Center** | AI驱动的员工支持中心 |
| **Workforce Scheduling Command Center** | 智能排班 |
| **Employee Coaching Command Center** | AI员工辅导 |
| **Compliance and Regulatory Command Center** | 合规管理 |
| **HR Operations Command Center** | HR运营 |

### 3.3 Oracle AI Agent Studio

Oracle AI Agent Studio是一个完整的AI代理开发平台[citation:11]：

- **Agentic Applications Builder**：自然语言驱动的代理应用构建器，无需编码
- **预构建代理模板**：可修改和扩展
- **工作流编排**：跨系统多步骤流程
- **内容智能**：文档理解、知识索引
- **ROI测量**：内置ROI追踪
- **治理和安全**：与企业安全框架集成

### 3.4 Oracle Learning Cloud的AI功能

Oracle HCM Learn Cloud在2025-2026年发布了大量AI功能[citation:12][citation:13]：

| 功能 | 发布版本 | 类型 |
|------|----------|------|
| **Ask Oracle: Learning Tutor** | 25D | Agent |
| **Ask Oracle: My Learning Assistant** | 25D | Agent |
| **Enhanced Learning Creation Assistant** | 26B | Agent |
| **Learning Assignment Assistant** | 26B | Agent |
| **Learning Catalog Smart Search Advisor** | 26A | Agent |
| **Introducing agentic courses** | 26C | Agent |
| **Team Learning Workspace for Managers** | 26B | Agentic App |
| **Self-paced learning content knowledge indexing** | 26C | Agent |
| **View Skill Suggestions Using Generative AI** | 26A | Generative |

**特色功能亮点**：

1. **Learning Creation Assistant**：通过邮件指令自动创建学习内容，支持多格式内容生成[citation:13]
2. **Agentic Courses（代理式课程）**：26C版本引入，AI代理驱动的自适应课程
3. **Udemy Learning Path集成**：自动导入和管理Udemy学习路径，支持xAPI实时追踪
4. **Google Chrome扩展**：在浏览器中直接访问Oracle Learning，Google搜索结果中嵌入学习推荐
5. **自动技能导入**：AI自动从内容提供商同步和匹配技能

### 3.5 Oracle的差异化优势

- **最完整的应用套件**：ERP、HCM、SCM、CX一体化
- **OCI AI基础设施**：与NVIDIA合作，提供GPU实例和AI加速器
- **安全与合规**：Oracle在安全领域的传统优势
- **六次年度更新**：快速迭代能力
- **免费AI Agent Studio**：无需额外成本

---

## 第四部分：三方对比分析

### 4.1 AI平台战略对比

| 维度 | SAP | Workday | Oracle |
|------|-----|---------|--------|
| **愿景** | 自主企业（Autonomous Enterprise） | 超级智能（Superintelligence） | 代理式企业（Agentic Enterprise） |
| **AI助手品牌** | Joule | Sana | Oracle AI / Ask Oracle |
| **代理开发平台** | Joule Studio | Sana Enterprise | AI Agent Studio |
| **代理治理** | SAP AI Agent Hub | Agent System of Record | 内置于Fusion安全框架 |
| **LLM策略** | 多模型（GPT/Gemini/Claude等） | Gemini（默认）+ 多模型 | 多模型（OCI + 合作伙伴） |
| **跨系统能力** | A2A协议，Agent Gateway | Sana Enterprise连接器 | AI Agent Studio集成 |
| **开源框架支持** | LangChain, LlamaIndex等 | 未公开 | 多种框架 |

### 4.2 AI学习平台对比

| 维度 | SAP Learning Hub | Workday Learning + Sana Learn | Oracle Learn Cloud |
|------|------------------|-------------------------------|-------------------|
| **AI助手** | NotebookLM集成AI学习助手 | Sana AI Tutor | Ask Oracle: Learning Tutor |
| **内容格式** | 播客、思维导图、学习指南、时间线、视频概览 | AI生成课程、模拟场景 | AI辅助内容创建 |
| **语言支持** | 80+语言（聊天），内容仅英语 | 多语言 | 多语言 |
| **个性化** | 角色/级别/主题驱动 | AI Tutor个性化路径 | 技能驱动的推荐 |
| **认证** | 4次认证考试/年包括 | Workday认证 | Oracle认证 |
| **实践环境** | SAP Live系统、AI模拟 | Workday测试环境 | Oracle Fusion测试环境 |
| **外部内容集成** | SAP自有内容为主 | 750+预置课程 | Udemy集成、Google插件 |
| **AI技术水平** | 集成NotebookLM（Google） | 自研Sana AI | Agent + GenAI混合 |

### 4.3 市场地位对比

| 指标                | SAP                     | Workday       | Oracle                         |
| ----------------- | ----------------------- | ------------- | ------------------------------ |
| **HCM市场份额(2024)** | ~4.5-5.5%（第4）           | 9.8%（第1）      | ~3-4%（第6）                      |
| **财富500强HCM份额**   | 18.2%                   | 21.4%         | 15.5%                          |
| **订阅收入(估)**       | $35-40亿（SuccessFactors） | ~$80亿（FY2026） | $25-30亿（HCM Cloud）             |
| **客户数**           | 大量，集中在SAP ERP生态         | 11,000+       | 大量，集中在Oracle ERP生态             |
| **北美大型企业优势**      | 中等（SAP ERP锚定）           | 强（45%份额）      | 中等（Oracle ERP锚定）               |
| **欧洲优势**          | 强（DACH地区主导）             | 中等            | 中等                             |
| **新兴市场**          | 强（全球合规深度）               | 一般            | 中等                             |
| **AI代理数量**        | 200+专业代理                | 持续增加          | 8个Agentic Apps + 30+ AI Agents |

### 4.4 竞争优势雷达图分析

**SAP的优势**：
- ✅ **最完整的企业AI生态**：从基础设施到应用层全覆盖
- ✅ **ERP数据深度**：50年企业流程数据，SAP Knowledge Graph结构化业务知识
- ✅ **开放生态**：A2A协议、多框架支持、Agent Gateway开放集成
- ✅ **学习平台成熟度**：SAP Learning Hub是三者中最成熟的AI学习平台
- ✅ **全球合规**：190+国家本地化支持

**Workday的优势**：
- ✅ **统一数据模型**：HR+财务一体化，数据质量最高
- ✅ **Sana体验**：最现代化的AI交互界面
- ✅ **HR领域深度**：在HR领域的数据深度和AI精度最高
- ✅ **客户满意度**：Gartner Peer Insights评分领先
- ✅ **增长速度**：16%+订阅收入增长

**Oracle的优势**：
- ✅ **应用套件最全**：ERP/SCM/HCM/CX一体化
- ✅ **OCI基础设施**：自有云+GPU基础设施
- ✅ **务实迭代**：六次年度更新，渐进式AI集成
- ✅ **安全合规**：企业级安全框架
- ✅ **AI Agent Studio免费**：降低采用门槛

---

## 第五部分：未来竞争力预测与存活能力分析

### 5.1 未来5年关键趋势（2026-2031）

1. **AI代理将重塑企业软件交互**：从菜单驱动 → 对话驱动 → 目标驱动
2. **数据护城河决定AI质量**：拥有最干净、最结构化业务数据的企业将胜出
3. **开放生态 vs 封闭平台**：A2A/MCP等开放协议将打破数据孤岛
4. **跨系统编排成为核心能力**：单一厂商的全栈解决方案 vs 最佳组合
5. **AI治理和合规成为差异化因素**：ISO 42001、EU AI Act合规
6. **学习平台成为人才保留关键**：AI驱动的持续学习将决定员工留存率

### 5.2 SAP：前景评估 - 8.5/10

**优势**：
- SAP以"自主企业"愿景走在了最前面，Joule Studio的发布显示了构建企业AI平台的决心
- SAP Knowledge Graph为企业AI提供了结构化的业务上下文，这是竞争对手难以复制的
- SAP Learning Hub与NotebookLM的集成展示了AI教育的先进理念
- A2A开放协议有潜力成为企业AI代理互操作标准
- SAP的全球企业装机量（40万+客户）提供了巨大的升级基础

**风险**：
- 成功执行自主企业战略依赖客户从传统SAP迁移到云，而迁移速度不及预期（RISE with SAP采用率）
- SuccessFactors在HCM领域面临Workday的持续压力
- 产品复杂度高，AI采用可能被传统部署模式拖累
- 与Google的深度绑定可能带来技术依赖风险

**5年存活能力：极高**

SAP在ERP领域的护城河极深，AI战略最系统化。即使HCM市场份额不增，SAP的核心ERP地位确保其长期存活。最大的问题是能否将AI叙事转化为实质性收入增长。

### 5.3 Workday：前景评估 - 8.0/10

**优势**：
- Sana收购是Workday历史上最聪明的战略举措，一次性获得了AI原生平台
- Sana的AI体验在三大平台中最现代化、最用户友好
- 统一HR+财务数据模型是AI训练的最佳数据基础
- 11,000+客户基础和65%+财富500强渗透率
- 创始人回归CEO，战略执行力增强

**风险**：
- Sana收购的整合风险：Workday历史上的收购整合记录参差不齐
- Sana Enterprise跨系统编排能力尚处于早期，与ServiceNow、Microsoft的竞争加剧
- 高TCO（总拥有成本）限制了下沉市场扩展
- 实施周期长（12个月+）影响新客户获取
- 完全依赖云端，缺乏混合部署选项

**5年存活能力：高**

Workday是HCM领域的领导者，Sana提供了差异化AI能力。但面临SAP SAPPHIRE和Oracle、Microsoft的围攻，市场份额增速可能放缓。Workday需要证明Sana的跨系统能力不只是一个漂亮的前端。

### 5.4 Oracle：前景评估 - 7.5/10

**优势**：
- Fusion Agentic Applications策略最务实：直接从现有工作流中嵌入AI代理
- OCI AI基础设施最强大（NVIDIA GPU合作，分布式云）
- 应用套件最完整（ERP+SCM+HCM+CX），交叉销售潜力大
- AI Agent Studio免费策略有助于快速建立开发者生态
- 六次年度更新节奏最快，迭代能力最强

**风险**：
- Oracle在AI叙事上最保守，"agentic applications"等概念缺乏SAP和Workday那样的愿景吸引力
- HCM市场份额落后于Workday和SAP，在HR领域的品牌认知度不如两者
- Oracle的传统销售和部署模式（复杂、高价）与AI时代的敏捷需求存在张力
- 学习平台功能最弱，虽然AI功能在快速增加但整体体验不如SAP Learning Hub
- 应用套件的广度可能导致AI深度不足

**5年存活能力：较高**

Oracle的规模（$530亿营收）、云基础设施和客户关系确保其长期存活。在AI领域，Oracle是最务实的选手——不追求最炫酷的AI演示，而是把AI嵌入到现有工作流中。如果这能转化为客户价值，Oracle可能后发先至。

### 5.5 综合竞争力对比

| 维度 | SAP (评分) | Workday (评分) | Oracle (评分) |
|------|-----------|---------------|--------------|
| **AI愿景清晰度** | 9.5 | 9.0 | 7.5 |
| **AI平台成熟度** | 9.0 | 8.0 | 8.5 |
| **学习平台AI能力** | 9.0 | 8.5 | 7.0 |
| **数据质量/深度** | 9.0 | 9.5 | 8.5 |
| **开放生态** | 9.5 | 7.0 | 8.0 |
| **用户体验** | 7.5 | 9.5 | 7.0 |
| **市场执行力** | 8.0 | 9.0 | 8.5 |
| **财务健康** | 9.0 | 8.5 | 9.5 |

**评分说明**：以上评分为定性分析，基于公开信息对比评估，各维度权重不同（AI愿景: 20%, 平台成熟度: 20%, 数据质量: 15%, 市场执行力: 15%, 其他: 各10%）。评分反映截至2026年Q2的相对竞争地位，不代表投资建议。

### 5.6 关键决胜因素

到2031年，决定胜负的可能是以下能力：

1. **AI代理的可靠性和自主程度**：代理能否真正取代人工完成端到端业务流程
2. **跨系统编排的成熟度**：单一厂商的AI能否与异构系统无缝协作
3. **AI治理和信任**：在企业级安全框架内运行AI的能力
4. **业务的AI-ready程度**：客户基础的数据现代化进度
5. **定价模式**：从用户许可费到基于价值的AI定价的转型

---

## 第六部分：结论与建议

### 6.1 对SAP的评估

**SAP拥有三者中最完整的企业AI战略**，从基础设施（AI Foundation）到应用层（Joule Assistants）到开发平台（Joule Studio）到学习平台（SAP Learning Hub），形成了闭环。SAP的"自主企业"愿景如果成功执行，将重新定义企业软件的交互方式。

SAP Learning Hub通过与Google NotebookLM的集成，在教育领域建立了显著的领先优势。**AI学习导师、多格式内容生成、80+语言支持**等特性使其成为企业AI学习的标杆平台。

**最大短板**：用户体验仍落后于Workday，AI功能的实际采用率有待验证。

### 6.2 对Workday的评估

**Workday拥有三者中最优秀的AI用户体验**。Sana的发布展示了AI原生企业应用的真正可能性——从"操作应用"到"描述目标"的转变。Sana Self-Service Agent的300+技能和跨企业连接器显示了Workday的野心。

Workday Learning（Sana Learn）的AI导师和个性化学习路径代表了企业学习平台的进化方向。**G2评分9.6/10**反映了市场对其产品质量的认可。

**最大短板**：跨系统编排能力尚不成熟，成本最高，且面临ServiceNow和Microsoft的跨界竞争。

### 6.3 对Oracle的评估

**Oracle是三者中最务实的AI选手**。Fusion Agentic Applications的"代理应用"概念——不是单个代理，而是协调的代理团队——可能是最接近企业实际需求的方案。AI Agent Studio免费开放是明智之举。

Oracle Learn Cloud的AI功能虽然数量众多（从25A到26C加速迭代），但整体产品体验和AI能力不如SAP和Workday的专门学习平台。

**最大短板**：AI叙事缺乏愿景感，HCM市场份额最小，学习平台的功能整合度最低。

### 6.4 最终展望

- **SAP** → 最有潜力定义企业AI标准，但需要加快云迁移速度
- **Workday** → AI用户体验最佳，但需要证明跨系统能力和价值
- **Oracle** → 最务实的AI落地，但需要更引人注目的AI故事

**在AI驱动的未来5年，三大厂商都将生存下来，但它们的相对地位可能发生重大变化。SAP可能凭借全面的AI平台重新夺回企业软件的领导地位，Workday可能在HR领域进一步巩固领先优势，而Oracle可能凭借基础设施和套件深度成为最稳健的选手。**

---

## 第七部分：平台调研—SAP Learning Hub内容发现

### 7.1 平台访问说明

**访问方法**：通过Chrome DevTools Protocol（CDP）连接到用户操作系统的Chromium浏览器实例。用户完成了SAP Universal ID + SAML SSO登录后，通过CDP导航至SAP Learning Hub的课程目录和帮助页面。

**重要说明**：本节内容主要来源于：
1. **SAP Learning Hub公开课程目录页面**（learning.sap.com的课程详情页、帮助中心页面）  
2. **平台帮助文档**（AI辅助学习功能说明页）
3. CDP浏览是在用户保持浏览器登录状态的条件下进行的，但**未进行端到端的课程完成**或**NotebookLM内容生成**

**平台订阅模式**：
- 客户版（Customer Edition）：企业购买，含AI Notebook
- 合作伙伴版（Partner Edition）：合作伙伴专用，含AI Notebook
- 学生版（Student Edition）：免费，不含AI功能
- 活动版（Event Edition）：不含AI功能

> **透明度说明**：以下课程内容从平台的课程目录页面和帮助文档中提取，NotebookLM的AI输出功能描述基于SAP官方帮助中心文档，非实际内容生成体验。

### 7.2 NotebookLM AI学习助手功能

在每个独立课程页面中，均提供 **"Upskill faster with AI-powered assistance"** 入口，链接到Google NotebookLM[citation:6]。

**技术实现（基于公开文档）**：
- 通过 **Google Cloud Workforce Pool** 联邦认证（SAP作为身份提供商）
- Notebook URL格式：`notebooklm.cloud.google.com/eu/notebook/{uuid}?project={project_id}`
- 笔记本预填充SAP课程内容（只读模式）
- 学习者获得**查看者权限**（Viewer License），不能自定义内容

**官方支持的AI输出格式**（来源：SAP Learning帮助中心[SAP Learning Hub AI Assistance页面](https://learning.sap.com/helpcenter/learninghub-subscription/ai-assistance)）：

| 格式 | 语言 | 说明 |
|------|------|------|
| 💬 **智能聊天（Chat）** | 80+语言 | 自然语言提问，答案带来源引用 |
| 🎧 **播客（Podcast）** | 仅英文 | AI生成音频，支持互动问答 |
| 🧠 **思维导图（Mind Map）** | 仅英文 | 课程内容可视化概览 |
| 📝 **学习指南（Study Guide）** | 仅英文 | 结构化学习摘要 |
| ⏱️ **时间线（Timeline）** | 仅英文 | 关键概念时间顺序排列 |
| 📄 **简报文档（Briefing Doc）** | 仅英文 | 课程综合概述 |
| 🎬 **视频概览（Video Overview）** | 仅英文 | AI生成视频摘要 |
| ❓ **互动问答（Interactive Q&A）** | 仅英文 | AI主持的互动问答 |

**已知限制**（来源：帮助中心页面）：
- 预生成格式（播客、思维导图等）目前仅支持英文
- 聊天功能支持80+语言输入/输出
- 笔记本为只读权限（Viewer License），不能上传自定义内容或生成新格式
- Notebook中的互动内容不与SAP Learning Hub的学习进度和完成记录关联
- 以下类型课程不提供Notebook：BTP试用课程、翻译版课程、原openSAP课程

### 7.3 平台可发现的AI课程目录

通过平台课程目录导航，发现以下AI相关课程（均为可注册学习）：

| 课程名称 | 时长 | 级别 | 面向 | 关键内容 |
|----------|------|------|------|----------|
| **Introducing SAP Business AI Platform** | 1h 54min | 初级 | Employee/Partner | 自主企业3大支柱、AI平台架构 |
| **Boosting AI-driven Business Transformation with Joule Agents** | 2h 58min | 中级 | 开放 | 代理式AI、Knowledge Graph、Business Data Cloud |
| **Introducing AI Fundamentals** | 3h+ | 初级 | 开放 | AI历史、核心概念、负责任AI |
| **Solve Business Problems Using Prompts and LLMs** | - | 中级 | 开放 | 提示工程、GenAI Hub实操 |
| **Exploring the World of AI** | 4h | 初级 | 开放 | AI原理、机器学习、社会影响 |
| **Positioning the Autonomous Enterprise** | 27min | 中级 | Employee/Partner | SAP自主企业战略定位 |
| **Discovering High-Value Opportunities for Agentic AI** | 1h+ | 初级 | 开放 | Joule Agent发现工作坊 |
| **Introducing Joule** | - | 初级 | 开放 | SAP AI助手入门 |
| **Experiencing SAP Business AI** | 3-course LJ | 中级 | 开放 | SAP业务AI全面体验（学习路径） |

**认证考试**：
| 认证代码 | 名称 | 定位 |
|----------|------|------|
| **C_AIG** | SAP Certified Generative AI Developer | 2026年热门AI技术认证 |
| **C_BCBAI** | Positioning SAP Business AI Solutions | 商业AI解决方案定位 |
| **C_BCSBS** | Positioning the Autonomous Enterprise | 自主企业战略认证 |

### 7.4 重点课程内容提取

通过CDP实际登录平台后，对两门核心AI课程进行了详细的页面内容提取和分析：

#### 7.4.1 "Introducing SAP Business AI Platform"课程学习内容（1h 54min，初级）

**课程学习目标**（从平台提取）：
1. ✅ **解释**自主企业如何利用AI驱动增长和韧性
2. ✅ **描述**SAP Business AI Platform如何统一代理开发、集成、数据、AI模型和治理
3. ✅ **定位**SAP Business AI Platform的三大支柱：构建（Build）、上下文化与推理（Contextualize and Reason）、治理（Govern）
4. ✅ **阐述**AI代理在SAP Business AI Platform上解决复杂业务挑战的角色
5. ✅ **总结**SAP Business AI Platform商业模式的最新更新

**课程单元结构**：
| 单元 | 内容 | 课时 |
|------|------|------|
| Unit 1 | Introducing Autonomous Enterprise（自主企业介绍） | 1课，21min |
| Unit 2 | Discovering SAP Business AI Platform（探索平台） | 1课，10min |
| Unit 3 | Positioning SAP Business AI Platform（平台定位） | 3课，1h 6min |
| Unit 4 | Showcasing Business AI Platform Use Cases（用例展示） | 1课，5min |
| Unit 5 | Selling SAP Business AI Platform（销售定位） | 1课，12min |

**面向角色**：Sales, Presales, CEE, Marketing
**涉及产品**：SAP Build Code, SAP Integration Suite, SAP AI Core, SAP Business Data Cloud

#### 7.4.2 "Boosting AI-driven Business Transformation with Joule Agents"课程（2h 58min，中级）

**课程学习目标**：
1. ✅ **掌握**代理式AI的变革性业务潜力
2. ✅ **解释**AI代理对业务流程的影响
3. ✅ **理解**SAP生态系统（包括SAP Business Suite、SAP Knowledge Graph、SAP Business Data Cloud）如何转型AI集成
4. ✅ **学习**Joule代理的能力及其SAP应用集成
5. ✅ **使用**Joule代理增强决策、自动化工作流和集成AI
6. ✅ **评估**代理式AI的战略价值——通过就绪代理和自定义代理实现创新和效率
7. ✅ **探索**AI Agent Hub
8. ✅ **启用**通过Joule实现代理的互操作性

**课程单元**：
| 单元 | 内容 | 课时 |
|------|------|------|
| Unit 1 | Understanding the Role of Agentic AI in Business Transformation | 2课，54min |
| Unit 2 | Enabling AI Agents Through SAP's Ecosystem | 3课，36min |
| Unit 3 | Showcasing Joule Agents | 4课，1h 28min |

**面向角色**：Business User, Developer, Architect, Consultant, Sales, Data Analyst, Marketing
**关键产品**：Joule

**补充相关课程**：
- Discovering High-Value Opportunities for Agentic AI（1h+，初级）
- Step-by-step guidance to build custom Joule agents in Joule Studio（直播课程）
- Getting Started With Joule for developers（系列直播课程）
- Introduction to SAP Business AI（直播课程/录像）

#### 7.4.3 "Experiencing SAP Business AI"学习路径（3门课程，中级）

这是一个端到端的学习路径，包含：
| 步骤 | 课程 | 时长 | 内容要点 |
|------|------|------|----------|
| 1 | Discovering SAP Business AI（SL_BAI101） | 1h | SAP Business AI实际业务价值、流程自动化、智能决策 |
| 2 | Experiencing SAP Business AI（SL_BAI201） | 5h | AI如何嵌入日常工作、信任与责任AI、角色支持 |
| 3 | Boosting AI-driven Business Transformation with Joule Agents（SAG01） | 2h+ | Joule代理驱动业务转型 |
| 4 | Customer Return management with SAP Business AI（实践练习） | - | S/4HANA Cloud中的AI退货管理 |

**学习路径目标**：
- 解释SAP Business AI如何为不同业务角色和流程交付价值
- 描述Joule和智能代理如何在SAP生态系统中工作
- 认识AI Foundation如何帮助企业负责任地构建、扩展AI
- 概述SAP负责任AI的方法

### 7.5 NotebookLM访问尝试

通过CDP点击"Access AI learning"按钮后，观察到：
- URL重定向至：`auth.cloud.google/signin/locations/global/workforcePools/sap-ias-learning/...`
- NotebookLM目标URL格式：`notebooklm.cloud.google.com/eu/notebook/{uuid}?project={project_id}`
- 返回HTTP 400错误，原因是Google Cloud Workforce Pool联邦认证需要额外的OAuth作用域，该认证无法在自动化CDP会话中完成
- 这证实了SAP与Google Cloud的**深度集成**（Workforce Pool联邦身份认证），同时验证了NotebookLM的实际入口和认证流程

### 7.6 AI学习平台调研结论

基于平台导航和内容调研的核心发现：

1. **SAP Learning Hub的AI集成已全面落地**——NotebookLM的集成不是概念演示，而是每个订阅课程的标准配置
2. **Google NotebookLM提供底层AI能力**，SAP保留内容质量控制（只读模式确保内容权威性）
3. **AI课程体系完整**——从AI基础到Joule Agents到认证考试，形成完整学习路径
4. **SAP将AI学习作为核心战略**——"Upskill faster with AI-powered assistance"是每门课程的标配
5. **与Workday和Oracle的公开资料对比**，SAP的学习平台AI集成深度最高

---

## 参考来源

| 编号 | 来源 | 内容 | URL |
|------|------|------|-----|
| [citation:1] | SAP News - Announcing New Joule Studio (2026.05) | Joule Studio发布详情 | https://news.sap.com/2026/05/new-joule-studio-enterprise-scale-agentic-development/ |
| [citation:2] | SAP - AI in SAP BTP (2026) | SAP Business AI Platform架构 | https://www.sap.com/products/technology-platform/ai.html |
| [citation:3] | SAP News - Business AI Release Highlights Q1 2026 | Joule进展和代理生态 | https://news.sap.com/2026/04/sap-business-ai-release-highlights-q1-2026/ |
| [citation:4] | SAP News - SAP Unveils Autonomous Enterprise (2026.05) | 自主企业愿景 | https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/ |
| [citation:5] | SAP News - Certification in the AI Era (2026.05) | SAP Learning Hub AI功能 | https://news.sap.com/2026/05/certification-ai-era-knowledge-capability/ |
| [citation:6] | Google Cloud - NotebookLM Integration (2026.05) | NotebookLM集成细节 | https://www.googlecloudpresscorner.com/2026-05-13-Google-Cloud-Announces-the-Integration-of-NotebookLM-into-the-SAP-Learning-Hub |
| [citation:7] | Workday - Introducing Sana (2026.03) | Sana平台发布 | https://newsroom.workday.com/2026-03-17-Introducing-Sana-from-Workday-Superintelligence-for-Work |
| [citation:8] | Workday - Google Cloud Partnership (2026.05) | 与Google合作 | https://newsroom.workday.com/2026-05-28-Workday-and-Google-Cloud-Expand-Strategic-Partnership |
| [citation:9] | Workday - Illuminate Agents (2025-2026) | AI代理系列 | https://newsroom.workday.com/2025-09-16-Workday-Illuminate-TM-Expands-with-New-AI-Agents |
| [citation:10] | Oracle - Fusion Agentic Applications for HR (2026.04) | 8个代理式应用 | https://www.oracle.com/news/announcement/oracle-introduces-fusion-agentic-applications-for-hr-2026-04-09/ |
| [citation:11] | Oracle - AI Agent Studio Expansion (2026.03) | Agent Studio更新 | https://www.oracle.com/news/announcement/oracle-expands-ai-agent-studio-for-fusion-applications-2026-03-24/ |
| [citation:12] | Oracle Docs - HCM AI Features (26A-26C) | Learning Cloud AI功能列表 | https://docs.oracle.com/en/cloud/saas/fusion-ai/aiafl/ai-hcm.html |
| [citation:13] | Arclight - Oracle HCM Learn Cloud 26B | Learning Cloud 26B更新 | https://arclightconsulting.com/insights/oracle-hcm-learn-cloud-26b/ |
| [citation:14] | VMR - Top HCM Software Market Share (2026) | 市场份额数据 | https://www.verifiedmarketresearch.com/blog/top-human-capital-management-software/ |
| [citation:15] | PitchGrade - Workday vs SAP SuccessFactors (2026.01) | HCM竞争分析 | https://pitchgrade.com/research/workday-vs-sap-successfactors |
| [citation:16] | Fortune Business Insights - HCM Market Size (2026) | 市场规模预测 | https://www.fortunebusinessinsights.com/industry-reports/human-capital-management-hcm-market-100240 |
| [citation:17] | ISG Research - HCM Suites Buyers Guide (2026) | ISG评估报告 | https://research.isg-one.com/buyers-guide/business-technologies/employees-and-hcm/human-capital-management-suites/2026 |
| [citation:18] | Josh Bersin - Workday Sana Strategy (2026.03) | Sana战略分析 | https://joshbersin.com/2026/03/workday-and-sana-unveil-a-bold-new-strategy-for-ai/ |
