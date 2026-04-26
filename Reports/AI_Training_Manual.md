# AI 培训手册：Prompt、MCP、Skills、RAG 与 OpenCLAW 实战指南

> 基于 YouTube 2023-2026 年最新教程整理 | 快速上手 + 深度进阶

---

## 目录

1. [Prompt Engineering（提示工程）](#1-prompt-engineering提示工程)
2. [MCP（Model Context Protocol）](#2-mcpmodel-context-protocol)
3. [Skills（技能系统）](#3-skills技能系统)
4. [RAG（检索增强生成）](#4-rag检索增强生成)
5. [OpenCLAW（自主AI代理框架）](#5-openclaw自主ai代理框架)
6. [AI Agent（AI代理）架构与实践](#6-ai-agentai代理架构与实践)
7. [实战项目整合](#7-实战项目整合)
8. [快速参考卡片](#8-快速参考卡片)

---

## 1. Prompt Engineering（提示工程）

### 1.1 什么是提示工程？

提示工程（Prompt Engineering）是与大型语言模型（LLM）交互的核心技能。它不是"问问题"，而是**设计高质量输入以获得最佳输出的艺术与科学**。

> AI 不像人类那样"理解"文字——它将所有输入视为数学数据。理解这一点是写出有效提示的关键。

### 1.2 核心原则

#### 清晰明确（Clarity）

```
❌ 差: "写点关于AI的东西"
✅ 好: "写一篇500字的文章，介绍生成式AI在客服领域的3个应用场景，面向初学者"
```

#### 结构化输出（Structure）

```
请按照以下JSON格式输出结果：
{
  "topic": "主题",
  "key_points": ["要点1", "要点2", "要点3"],
  "conclusion": "结论（不超过50字）"
}
```

#### 上下文提供（Context）

```
你是一位拥有10年经验的Python后端工程师。
请帮我审查以下代码的性能问题：
[代码片段]
```

### 1.3 高级提示模式

#### 思维链（Chain of Thought, CoT）

```
让我们一步步思考这个问题：
1. 首先...
2. 然后...
3. 最后...
```

#### few-shot 学习

```
输入: "今天天气真好"
情感: 正面

输入: "这个产品太差了"
情感: 负面

输入: "还可以，中规中矩"
情感:
```

#### 角色扮演（Role Playing）

```
你是一位资深的产品经理。
你的职责是：
1. 分析用户需求
2. 制定产品路线图
3. 与工程师沟通技术可行性

现在，请评估以下功能需求：
```

### 1.4 提示框架

| 框架 | 结构 | 适用场景 |
|------|------|----------|
| **RTF** | Role + Task + Format | 通用场景 |
| **BROKE** | Background + Role + Objective + Key Result + Evaluate | 复杂任务 |
| **APE** | Action + Purpose + Expectation | 目标导向 |
| **TAG** | Task + Action + Goal | 简单任务 |

### 1.5 实践技巧

```python
# Python: 构建结构化提示的示例
def build_prompt(task, context="", format="", constraints=""):
    prompt = f"""Task: {task}
Context: {context}
Format: {format}
Constraints: {constraints}
"""
    return prompt
```

#### 常见错误与避免方法

| 错误 | 问题 | 解决方案 |
|------|------|----------|
| 过于笼统 | 输出模糊 | 提供具体例子 |
| 忽略格式 | 输出难以使用 | 明确指定输出格式 |
| 一次多问 | 混淆重点 | 拆分任务 |
| 不迭代 | 首次结果不满意 | 优化提示并重试 |

### 1.6 进阶：提示工程工具链

- **PromptPerfect** - 自动优化提示
- **PromptLab** - 可视化提示构建
- **LangChain** - 提示模板化管理

---

## 2. MCP（Model Context Protocol）

### 2.1 为什么需要 MCP？

在 MCP 出现之前，AI 工具集成是一片混乱：
- 每个工具的 API 都不同
- 检索增强各地实现各异
- 没有工具架构规范 → 无尽的幻觉
- 开发者构建的插件系统互不兼容

**MCP 的诞生**：2024年11月由 Anthropic 发布，旨在解决"N×M 问题"（N个客户端 × M个服务器 = N×M 个定制实现）。

### 2.2 MCP 是什么？

**Model Context Protocol (MCP)** 是一个开放协议，标准化了应用程序如何向大型语言模型提供上下文。

> 把它想象成 AI 世界的"USB-C 接口"——就像 USB-C 简化了设备连接一样，MCP 正在为 AI 应用做同样的事情。

### 2.3 MCP 三大支柱

```
┌─────────────────────────────────────┐
│           MCP 生态系统               │
├─────────────────────────────────────┤
│  1. Tools（工具）                   │
│     - 模型可以安全调用的函数         │
│     - 调用契约、错误语义、文档       │
│                                     │
│  2. Resources（资源）               │
│     - 模型可以访问的持久化数据       │
│     - 文件、数据库、API响应          │
│                                     │
│  3. Prompts（提示模板）             │
│     - 预定义的提示模板               │
│     - 可复用的指令集                 │
└─────────────────────────────────────┘
```

### 2.4 MCP 架构

```
┌──────────────┐
│   LLM/Agent  │  ← Host（主机）：AI 界面
└───────┬──────┘
        │ MCP
        ▼
┌──────────────┐
│  MCP Client  │  ← 创建与服务器的1:1连接
└───────┬──────┘
        │ JSON-RPC
        ▼
┌──────────────┐
│  MCP Server  │  ← 暴露外部数据和功能
└───────┬──────┘
        │
        ▼
┌──────────────┐
│ Data Sources │  ← APIs、数据库、文件系统
└──────────────┘
```

### 2.5 MCP vs Function Calling vs REST API

| 特性 | REST API | Function Calling | MCP |
|------|----------|------------------|-----|
| 是什么 | HTTP请求响应模式 | LLM输出结构化JSON调用函数 | 开放协议连接AI客户端到工具和数据 |
| 层级 | 传输层(HTTP) | 模型能力 | 应用协议(使用JSON-RPC) |
| 工具发现 | 手动 | 静态(每次请求发送) | 动态(运行时发现) |
| 状态 | 无状态 | 无状态 | 有状态(持久会话) |
| 扩展性 | N个API=N个集成 | 所有工具在每次请求中 | 按需加载工具 |

**何时使用**：
- 简单脚本调用1-2个API → REST API
- 聊天机器人3-5个工具，单一LLM提供商 → Function Calling
- 代理10+工具，多提供商 → MCP
- 企业代理有认证需求 → MCP

### 2.6 快速上手：创建 MCP Server

使用 **FastMCP**（2025年最开发者友好的实现）：

```python
# mcp_tools.py
from fastmcp import FastMCP

# 创建 MCP 服务器
mcp = FastMCP("Calculator")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool()
def get_weather(location: str) -> str:
    """Get weather for a location"""
    return f"Weather in {location}: Sunny, 72°F"

@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run()
```

**运行方式**：
```bash
# 本地开发（stdio）
python mcp_tools.py

# 生产环境（HTTP）
python mcp_tools.py --transport http --port 8080
```

### 2.7 MCP 工具调用示例

```python
# 从 HTTP 端点调用 MCP 工具
import httpx

async def call_mcp_tool(tool_name: str, args: dict):
    response = await httpx.post(
        "http://localhost:8080/tool/call",
        json={"tool": tool_name, "args": args}
    )
    return response.json()

# 使用示例
result = await call_mcp_tool("get_weather", {"location": "Beijing"})
```

### 2.8 MCP 客户端集成

```python
# 连接到 MCP 服务器
from mcp import Client

async with Client(mcp_server_uri="http://localhost:8080") as client:
    # 调用工具
    result = await client.call_tool(
        name="get_weather",
        arguments={"location": "Tokyo"}
    )
```

### 2.9 主流 MCP 服务器生态

| 类别 | 服务器 | 功能 |
|------|--------|------|
| **数据** | Filesystem MCP | 本地文件访问 |
| **数据** | PostgreSQL MCP | 数据库查询 |
| **数据** | GitHub MCP | 代码仓库操作 |
| **数据** | YouTube MCP | 视频数据获取 |
| **工具** | Brave Search | 网页搜索 |
| **工具** | Puppeteer | 浏览器自动化 |

### 2.10 2026年 MCP 发展趋势

- ✅ OpenAI Agents SDK 支持 MCP
- ✅ Claude Desktop/Code 原生支持
- ✅ 2025年12月捐赠给 Linux 基金会
- ✅ MCP SDK 月活超 9700万

---

## 3. Skills（技能系统）

### 3.1 什么是 Skills？

**Skills** 是 Anthropic 于2025年10月推出的功能，允许自定义 AI 执行特定任务的方式。

> Skills 是包含指令、脚本和资源的文件夹，AI 在需要时可以进行加载。

### 3.2 Skills 工作原理

```
┌─────────────────────────────────────────────┐
│           Skills 工作流程                    │
├─────────────────────────────────────────────┤
│ 1. 任务触发：用户提出请求                     │
│ 2. 技能扫描：AI 扫描可用的 Skills            │
│ 3. 技能加载：加载相关的 Skill                │
│ 4. 执行任务：使用 Skill 中的指令和工具        │
│ 5. 返回结果                                 │
└─────────────────────────────────────────────┘
```

### 3.3 Skills 结构

```
my_skill/
├── skill.yaml          # 技能定义
├── instructions.md     # 详细指令
├── scripts/            # 可执行脚本
│   └── setup.sh
├── resources/          # 参考资源
│   └── examples/
└── config.json         # 配置
```

### 3.4 skill.yaml 示例

```yaml
name: excel_analyzer
description: 分析 Excel 文件并生成报告
version: 1.0.0
capabilities:
  - read_excel
  - analyze_data
  - generate_charts
trigger_keywords:
  - "分析 Excel"
  - "excel 报告"
  - "数据透视"
```

### 3.5 创建自定义 Skill

```python
# 步骤1: 定义技能
skill_definition = {
    "name": "code_reviewer",
    "description": "专业的代码审查助手",
    "instructions": """
    你是一位资深代码审查专家。
    审查重点：
    1. 代码安全性
    2. 性能问题
    3. 代码可读性
    4. 最佳实践遵循
    
    输出格式：
    ## 问题列表
    - [严重] 文件:行号 - 描述
    - [建议] 文件:行号 - 描述
    
    ## 总体评价
    """,
    "examples": [
        {
            "input": "审查这段代码...",
            "output": "..."
        }
    ]
}

# 步骤2: 注册技能
# 在 Claude Code 或 API 中注册
```

### 3.6 Skills vs MCP

| 特性 | Skills | MCP |
|------|--------|-----|
| 用途 | 自定义 AI 行为模式 | 连接外部工具和数据 |
| 触发 | 基于任务关键词 | 按需调用 |
| 持久性 | 跨会话 | 运行时连接 |
| 组合 | 可嵌套 | 可叠加 |

---

## 4. RAG（检索增强生成）

### 4.1 什么是 RAG？

**Retrieval-Augmented Generation (RAG)** 是一种混合方法，结合了语言模型的优势和外部知识检索。

```
传统 LLM 问题：
❌ 知识有限（训练数据截止日期）
❌ 幻觉（生成错误信息）
❌ 无法访问私有数据

RAG 解决方案：
✅ 动态检索最新/私有数据
✅ 减少幻觉
✅ 提供可验证的答案
```

### 4.2 RAG 架构

```
┌─────────────────────────────────────────────────────┐
│                  RAG 工作流程                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  用户查询 ──▶  查询编码器 ──▶ 向量数据库检索          │
│                    │                  │             │
│                    ▼                  ▼             │
│              [相关文档1]      [相关文档2]            │
│                    │                  │             │
│                    └────────┬─────────┘             │
│                             ▼                       │
│                    增强提示 (Prompt + Context)      │
│                             ▼                       │
│                    LLM 生成答案                     │
│                             ▼                       │
│                    返回引用来源的回答               │
└─────────────────────────────────────────────────────┘
```

### 4.3 RAG 核心组件

| 组件 | 功能 | 主流技术 |
|------|------|----------|
| **文档加载器** | 读取各种格式文档 | LangChain, LlamaIndex |
| **文本分块** | 将大文档分割成小块 | RecursiveCharacterTextSplitter |
| **嵌入模型** | 将文本转为向量 | OpenAI Embeddings, BGE |
| **向量数据库** | 存储和检索向量 | Pinecone, Weaviate, Chroma |
| **检索器** | 找到相关文档 | Similarity, MMR, TF-IDF |
| **生成器** | 基于上下文生成 | GPT, Claude, Llama |

### 4.4 快速上手：基础 RAG 管道

```python
# 使用 LangChain 构建简单 RAG
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA

# 1. 加载文档
loader = TextLoader("knowledge.txt")
documents = loader.load()

# 2. 分块
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
chunks = text_splitter.split_documents(documents)

# 3. 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(chunks, embeddings)

# 4. 创建检索器
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)

# 5. 创建 QA 链
llm = ChatOpenAI(model="gpt-4")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever
)

# 6. 使用
result = qa_chain.invoke("什么是 RAG？")
print(result["result"])
```

### 4.5 高级 RAG 技术

#### 4.5.1 混合检索

```python
# 结合向量检索和关键词检索
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# 向量检索
vector_retriever = vectorstore.as_retriever()

# BM25 关键词检索
bm25_retriever = BM25Retriever.from_documents(chunks)

# 集成
ensemble_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.5, 0.5]
)
```

#### 4.5.2 重排序（Reranking）

```python
# 使用 cross-encoder 重排序结果
from langchain.retrievers import ContextualCompressionRetriever
from langchain_community.retrievers import CohereRerank

base_retriever = vectorstore.as_retriever()
compression_retriever = ContextualCompressionRetriever(
    base_compressor=CohereRerank(),
    base_retriever=base_retriever
)
```

#### 4.5.3 查询改写

```python
# 改写查询以提高检索效果
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate

# 自定义提示
prompt_template = """
基于以下对话历史，回答最后的问题。
如果历史不相关，只回答当前问题。

对话历史：
{chat_history}

问题：{question}

回答：
"""
```

### 4.6 RAG 评估指标

| 指标 | 描述 | 工具 |
|------|------|------|
| **Faithfulness** | 生成内容是否基于检索文档 | LangChain Eval |
| **Answer Relevance** | 答案与问题的相关性 | RAGAs |
| **Context Precision** | 检索内容的精确度 | TruLens |
| **Context Recall** | 检索内容的完整性 | custom |

### 4.7 RAG 最佳实践

1. **文档预处理**
   - 清理HTML/特殊字符
   - 提取元数据
   - 合理分块（512-1024 tokens）

2. **索引优化**
   - 使用合适的嵌入模型
   - 调整 top-k 值
   - 实现缓存

3. **查询优化**
   - 添加查询前缀
   - 使用查询扩展
   - 实现对话历史

4. **生产部署**
   - 实现监控
   - 定期更新索引
   - A/B 测试不同配置

---

## 5. OpenCLAW（自主AI代理框架）

### 5.1 什么是 OpenCLAW？

**OpenCLAW** 是由奥地利软件工程师 Peter Steinberger 于2025年底发布的开源 AI 代理框架。

> 2026年1月，发布后48小时内 GitHub 星标超过 100,000，2周内改变人们对个人 AI 的认知。

### 5.2 核心特性

```
┌─────────────────────────────────────────────────┐
│              OpenCLAW 能力                       │
├─────────────────────────────────────────────────┤
│ ✅ 执行 Shell 命令                               │
│ ✅ 编辑文件                                      │
│ ✅ 浏览网页                                      │
│ ✅ 管理数字生活                                  │
│ ✅ 自主决策与执行                                │
│ ✅ 多步骤任务完成                                │
└─────────────────────────────────────────────────┘
```

### 5.3 OpenCLAW vs 传统 Chatbot

| 特性 | 传统 Chatbot | OpenCLAW |
|------|--------------|----------|
| 交互模式 | 等待提示 | 自主解释目标 |
| 执行能力 | 仅生成文本 | 可执行操作 |
| 工具使用 | 需手动指定 | 自动选择工具 |
| 状态保持 | 有限 | 长期记忆 |
| 适用场景 | 对话、问答 | 自动化工作流 |

### 5.4 架构解析

```
┌─────────────────────────────────────────────────────┐
│              OpenCLAW 架构                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐                                   │
│  │   用户目标   │  ← "帮我预约下周一的会议"         │
│  └──────┬──────┘                                   │
│         ▼                                          │
│  ┌─────────────┐                                   │
│  │   目标解析   │  ← 理解任务、分解步骤              │
│  └──────┬──────┘                                   │
│         ▼                                          │
│  ┌─────────────┐    ┌─────────────┐               │
│  │   工具选择   │───▶│  执行循环   │               │
│  └──────┬──────┘    └──────┬──────┘               │
│         │                  │                        │
│         ▼                  ▼                        │
│  ┌─────────────┐    ┌─────────────┐               │
│  │   记忆系统   │◀───│  结果评估   │               │
│  └─────────────┘    └─────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.5 快速上手：安装与配置

#### 环境要求
- macOS (推荐) 或 Linux
- Python 3.10+
- OpenAI API Key 或 Anthropic API Key

#### 安装

```bash
# 克隆仓库
git clone https://github.com/steinbergerp/openclaw.git
cd openclaw

# 安装依赖
pip install -e .

# 配置
cp .env.example .env
# 编辑 .env 添加 API 密钥
```

#### 配置文件 (.env)

```bash
# 选择模型提供商
ANTHROPIC_API_KEY=sk-ant-...
# 或
OPENAI_API_KEY=sk-...

# 设置工作目录
OPENCLAW_WORKING_DIR=~/openclaw-workspace

# 权限级别
ALLOW_SHELL=true
ALLOW_BROWSER=true
ALLOW_FILE_EDIT=true
```

### 5.6 使用 OpenCLAW

```bash
# 交互模式
openclaw

# 执行单次任务
openclaw "帮我查一下今天北京的天气"

# 带详细日志
openclaw --verbose "帮我写一个Python脚本来自动化处理Excel"
```

### 5.7 高级配置

#### 自定义工具

```python
# config/tools.py
from openclaw import Tool

class MyCustomTool(Tool):
    name = "my_custom_tool"
    description = "自定义工具的描述"
    
    def execute(self, **kwargs):
        # 实现逻辑
        return result
    
    def validate(self, **kwargs):
        # 验证参数
        return True
```

#### 安全设置

```yaml
# config/security.yaml
permissions:
  shell:
    allowed_commands:
      - git
      - python
      - pip
    denied_patterns:
      - rm -rf /
      - dd if=
  
  network:
    allowed_domains:
      - api.openai.com
      - api.anthropic.com
  
  file:
    allowed_paths:
      - ~/openclaw-workspace/
    denied_paths:
      - /etc/
      - ~/.ssh/
```

### 5.8 OpenCLAW 的安全考虑

> ⚠️ OpenCLAW 给予 AI 对计算机的 root 访问权限，需要谨慎使用

| 风险 | 缓解措施 |
|------|----------|
| 恶意代码执行 | 限制允许的命令 |
| 数据泄露 | 隔离工作目录 |
| 权限过宽 | 最小权限原则 |
| 插件漏洞 | 审查插件来源 |

### 5.9 实际应用案例

```bash
# 示例1: 自动化研究
openclaw "调研2025年最新AI代理框架，写一份5页报告"

# 示例2: 代码开发
openclaw "创建一个Flask API，包含用户认证和CRUD功能"

# 示例3: 数据处理
openclaw "分析sales.csv，生成月度销售趋势图表"
```

---

## 6. AI Agent（AI代理）架构与实践

### 6.1 什么是 AI Agent？

AI Agent 是**能够自主解释目标、选择工具、使用记忆并在连续执行循环中运行的系统**。

```
Agent 核心要素：
┌─────────────────────────────────────────┐
│  ┌─────────┐    ┌─────────┐            │
│  │   LLM   │ +  │  Tools  │ = Agent    │
│  └─────────┘    └─────────┘            │
│       +              +                  │
│  ┌─────────┐    ┌─────────┐            │
│  │ Memory  │ +  │ Planner │            │
│  └─────────┘    └─────────┘            │
└─────────────────────────────────────────┘
```

### 6.2 Agent 架构模式

#### 6.2.1 单代理模式（Single Agent）

```
用户 → [LLM + Tools] → 执行 → 返回结果
```

适用：简单任务、单一工具调用

#### 6.2.2 代理层级模式（Hierarchy）

```
         ┌─────────────┐
         │  Supervisor │
         └──────┬──────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐
│Agent A│  │Agent B│  │Agent C│
└───────┘  └───────┘  └───────┘
```

适用：多领域任务、复杂工作流

#### 6.2.3 并行代理模式（Parallel Agents）

```
用户 ──┬──▶ [Agent 1] ──┐
      ─┼──▶ [Agent 2] ──┼──▶ 汇总结果
      ─┴──▶ [Agent 3] ──┘
```

适用：独立子任务、加速处理

#### 6.2.4 反思模式（Reflection）

```
任务 ──▶ Agent ──▶ 评估 ──▶ 改进 ──▶ 再次执行
                    ↑
                    └──────────────┘
```

适用：复杂推理、需要迭代优化

### 6.3 主流 Agent 框架对比

| 框架 | 特点 | 适用场景 | GitHub Stars |
|------|------|----------|--------------|
| **LangChain** | 全栈、灵活性高 | 生产级应用 | 95k+ |
| **LlamaIndex** | 专注 RAG | 知识管理 | 30k+ |
| **AutoGen** | 多代理协作 | 复杂工作流 | 35k+ |
| **CrewAI** | 角色扮演代理 | 团队协作 | 28k+ |
| **OpenAI Agents SDK** | 官方方案 | OpenAI 生态 | 新兴 |
| **Google ADK** | 谷歌生态 | 企业应用 | 新兴 |

### 6.4 构建你的第一个 Agent

```python
# 使用 LangChain 构建 Agent
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool

# 1. 定义工具
def get_weather(location: str) -> str:
    """获取指定位置的天气"""
    return f"{location} 天气晴朗，25°C"

tools = [
    Tool(
        name="weather",
        func=get_weather,
        description="获取天气信息，输入为城市名称"
    )
]

# 2. 创建提示
from langchain.prompts import PromptTemplate

prompt = PromptTemplate.from_template("""
你是一个有帮助的助手。
用户问题: {input}

你可以使用以下工具:
- weather: 获取天气信息

请回答用户的问题。
""")

# 3. 创建 Agent
llm = ChatOpenAI(model="gpt-4")
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 4. 执行
result = agent_executor.invoke({"input": "北京今天天气怎么样？"})
print(result["output"])
```

### 6.5 Memory（记忆系统）

```python
# 短期记忆 + 长期记忆
from langchain.memory import ConversationBufferMemory
from langchain.memory.summary import SummarizerMixin

# 缓冲记忆（短期）
memory = ConversationBufferMemory(
    return_messages=True,
    output_key="output",
    input_key="input"
)

# 摘要记忆（长期）
from langchain.memory.summary import SummarizerMixin

class CustomMemory(SummarizerMixin, ConversationBufferMemory):
    pass
```

### 6.6 Tool Use（工具使用）

```python
# 定义复杂工具
from langchain.tools import StructuredTool

def calculate_bmi(weight_kg: float, height_m: float) -> float:
    """计算BMI指数"""
    return weight_kg / (height_m ** 2)

def get_bmi_advice(bmi: float) -> str:
    """根据BMI给出健康建议"""
    if bmi < 18.5:
        return "体重过轻，建议适当增加营养"
    elif bmi < 24:
        return "正常范围，请保持"
    elif bmi < 28:
        return "超重，建议适当运动"
    else:
        return "肥胖，建议咨询医生"

tools = [
    StructuredTool.from_function(
        func=calculate_bmi,
        description="计算BMI，需要体重(kg)和身高(m)"
    ),
    StructuredTool.from_function(
        func=get_bmi_advice,
        description="根据BMI值给出健康建议"
    )
]
```

---

## 7. 实战项目整合

### 7.1 项目：企业知识助手

**目标**：构建一个可以回答企业文档问题的 RAG 助手

```python
# app.py - 完整示例
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA
from fastapi import FastAPI
import uvicorn

# 配置
app = FastAPI(title="企业知识助手")

# 1. 构建知识库
def build_knowledge_base():
    loader = DirectoryLoader("./docs", glob="**/*.md")
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = text_splitter.split_documents(documents)
    
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(chunks, embeddings)
    
    return vectorstore.as_retriever()

# 2. 创建 QA 链
retriever = build_knowledge_base()
llm = ChatOpenAI(model="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff"
)

# 3. API 端点
@app.get("/ask")
async def ask_question(q: str):
    result = qa_chain.invoke({"query": q})
    return {"answer": result["result"]}

if __name__ == "__main__":
    uvicorn.run(app, port=8000)
```

### 7.2 项目：MCP 天气服务

```python
# weather_mcp_server.py
from fastmcp import FastMCP

mcp = FastMCP("WeatherService")

@mcp.tool()
async def get_weather(city: str) -> dict:
    """获取城市天气"""
    # 实际调用天气API
    return {
        "city": city,
        "temperature": "25°C",
        "condition": "Sunny",
        "humidity": "45%"
    }

@mcp.tool()
async def get_forecast(city: str, days: int = 7) -> dict:
    """获取天气预报"""
    return {
        "city": city,
        "forecast": [
            {"day": i+1, "temp": "25°C", "condition": "Sunny"}
            for i in range(days)
        ]
    }

if __name__ == "__main__":
    mcp.run()
```

### 7.3 项目：自动化研究代理

```python
# research_agent.py
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
import requests

def search_web(query: str) -> str:
    """网络搜索工具"""
    response = requests.get(
        "https://api.search.example.com",
        params={"q": query}
    )
    return response.json()

def save_to_file(content: str, filename: str) -> str:
    """保存文件"""
    with open(filename, "w") as f:
        f.write(content)
    return f"已保存到 {filename}"

tools = [
    Tool(
        name="search",
        func=search_web,
        description="搜索网络信息"
    ),
    Tool(
        name="save",
        func=save_to_file,
        description="保存内容到文件"
    )
]

# 创建代理...
```

---

## 8. 快速参考卡片

### 8.1 Prompt 速查

| 场景 | 提示词开头 |
|------|------------|
| 代码审查 | "你是一位资深代码审查专家，审查以下代码..." |
| 解释概念 | "用通俗易懂的语言解释..." |
| 写作文风 | "以[作家名]的风格写..." |
| 步骤指导 | "一步步指导我完成..." |
| 对比分析 | "比较A和B的异同..." |

### 8.2 MCP 速查

```bash
# 安装 FastMCP
pip install fastmcp

# 运行 MCP 服务器
python server.py

# 常用传输模式
--transport stdio    # 本地开发
--transport http     # 生产环境
--transport sse      # 服务器发送事件
```

### 8.3 RAG 速查

```python
# 快速 RAG 管道
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 一行代码创建
qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(),
    chain_type="stuff",
    retriever=Chroma.from_documents(
        documents, 
        OpenAIEmbeddings()
    ).as_retriever()
)
```

### 8.4 Agent 模式选择

```
任务复杂度低 ──▶ 单代理
         │
         ▼
任务复杂 ──▶ 需要多步推理 ──▶ 反思代理
         │
         ▼
多领域任务 ──▶ 代理层级/路由
         │
         ▼
独立子任务 ──▶ 并行代理
```

---

## 附录：推荐学习资源

### YouTube 频道

| 频道 | 专长 | 推荐课程 |
|------|------|----------|
| **Matthew Berman** | AI 工具深度评测 | MCP 完整教程 |
| **DeepLearning.AI** | 理论+实践 | Prompt Engineering |
| **Tech With Tim** | Python 编程 | Agent 开发 |
| **Skill Leap AI** | AI 应用 | 实用技巧 |
| **Yannic Kilcher** | 论文解读 | 前沿研究 |

### GitHub 资源

- [microsoft/mcp-for-beginners](https://github.com/microsoft/mcp-for-beginners) - MCP 入门课程
- [steinbergerp/openclaw](https://github.com/steinbergerp/openclaw) - OpenCLAW 官方仓库
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain) - Agent 框架

### 官方文档

- [Anthropic MCP Docs](https://docs.anthropic.com/mcp)
- [LangChain Docs](https://python.langchain.com)
- [OpenCLAW Docs](https://openclaw.rocks)

---

## 结语

本手册涵盖了 2023-2026 年 AI 领域的核心技术：

1. **Prompt Engineering** - 与 AI 有效沟通的基础
2. **MCP** - AI 工具连接的标准协议
3. **Skills** - 自定义 AI 行为的能力
4. **RAG** - 让 AI 访问私有/最新知识
5. **OpenCLAW** - 自主执行任务的 AI 代理

> 提示：AI 领域发展迅速，建议定期关注官方文档和最新教程。

---

*手册版本: 2026.03.01*  
*基于 YouTube 2023-2026 年教程整理*
