# OpenCode + oh-my-opencode 完整使用手册

> 基于 YouTube 2025-2026 年教程整理 | 从入门到精通

---

## 目录

1. [OpenCode 概述](#1-opencode-概述)
2. [安装与配置](#2-安装与配置)
3. [核心功能与工具](#3-核心功能与工具)
4. [oh-my-opencode 深入指南](#4-oh-my-opencode-深入指南)
5. [Skills 自定义技能](#5-skills-自定义技能)
6. [MCP 集成](#6-mcp-集成)
7. [高级配置与技巧](#7-高级配置与技巧)
8. [工作流程最佳实践](#8-工作流程最佳实践)
9. [故障排除](#9-故障排除)

---

## 1. OpenCode 概述

### 1.1 什么是 OpenCode？

OpenCode 是一个开源的 AI 编程代理，专为终端环境设计，支持多种 AI 模型。

```
OpenCode 核心理念：
├── 开源免费 - 不受供应商限制
├── 任意模型 - 支持 Claude/GPT/Gemini/Ollama
├── 终端优先 - 为开发者打造
├── 本地优先 - 隐私安全
└── 可扩展 - 自定义技能系统
```

### 1.2 核心特性

| 特性 | 说明 |
|------|------|
| **开源** | 60k+ GitHub Stars |
| **多模型** | Claude, GPT, Gemini, Ollama |
| **终端** | 专为 CLI 设计 |
| **MCP** | 支持 Model Context Protocol |
| **Skills** | 自定义技能系统 |
| **Agents** | 多代理架构 |

### 1.3 与 Claude Code 对比

| 特性 | Claude Code | OpenCode |
|------|-------------|----------|
| **开源** | 否 | 是 |
| **模型** | 仅 Anthropic | 任意模型 |
| **价格** | API 费用 | 免费+API费用 |
| **定制** | 有限 | 完全可定制 |
| **社区** | Anthropic | 开源社区 |

---

## 2. 安装与配置

### 2.1 系统要求

```
最低要求：
├── 操作系统：macOS / Linux / Windows (WSL2)
├── 终端：iTerm2 / Windows Terminal
├── 内存：4GB+
└── 网络：访问模型 API

推荐配置：
├── 操作系统：macOS / Ubuntu 22.04+
├── 内存：8GB+
├── Ollama：本地运行模型（可选）
└── VPN：访问海外 API
```

### 2.2 安装步骤

#### macOS / Linux 安装

```bash
# 方法1：npm 安装
npm install -g opencode-ai

# 方法2：直接安装
curl -L https://raw.githubusercontent.com/anomalyco/opencode/main/install.sh | sh

# 方法3：Homebrew
brew install opencode-ai

# 验证安装
opencode --version
```

#### Windows 安装 (WSL)

```bash
# 在 WSL 中安装
curl -L https://raw.githubusercontent.com/anomalyco/opencode/main/install.sh | sh

# 或者使用 winget
winget install OpenCode
```

### 2.3 配置 API Keys

```bash
# 方式1：环境变量
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="AIza..."

# 方式2：配置文件
opencode config set api.anthropic.key "sk-ant-..."
opencode config set api.openai.key "sk-..."

# 方式3：交互式配置
opencode config
```

### 2.4 配置文件

```json
// ~/.config/opencode/config.json
{
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-20250514",
    "maxTokens": 64000
  },
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-..."
    },
    "openai": {
      "apiKey": "sk-..."
    },
    "google": {
      "apiKey": "AIza..."
    },
    "ollama": {
      "url": "http://localhost:11434"
    }
  },
  "permissions": {
    "allow": ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch"],
    "deny": []
  }
}
```

---

## 3. 核心功能与工具

### 3.1 可用工具

OpenCode 提供以下核心工具：

| 工具 | 功能 | 用途 |
|------|------|------|
| **Read** | 读取文件 | 查看代码 |
| **Write** | 写入文件 | 创建代码 |
| **Edit** | 编辑文件 | 修改代码 |
| **Bash** | 执行命令 | 运行脚本 |
| **Glob** | 文件搜索 | 查找文件 |
| **Grep** | 内容搜索 | 查找代码 |
| **WebFetch** | 网页获取 | 查阅文档 |
| **Task** | 任务管理 | 多代理 |

### 3.2 基本命令

```bash
# 启动交互式会话
opencode

# 指定项目目录
opencode /path/to/project

# 执行单次任务
opencode "创建 React 组件"

# 查看帮助
opencode --help

# 查看配置
opencode config list
```

### 3.3 交互命令

```
会话内命令：
/help     - 显示帮助
/exit     - 退出
/undo     - 撤销操作
/redo     - 重做操作
/history  - 查看历史
/save     - 保存会话
/load     - 加载会话
/clear    - 清除对话
```

---

## 4. oh-my-opencode 深入指南

### 4.1 什么是 oh-my-opencode？

oh-my-opencode 是 OpenCode 的增强配置框架，提供预设的技能、代理和工作流。

```
oh-my-opencode 核心功能：
├── 预设技能 - 开箱即用的能力
├── 智能代理 - 专业化任务代理
├── 知识管理 - 项目上下文
├── 命令系统 - 自定义命令
├── 主题系统 - UI 定制
└── 插件支持 - 功能扩展
```

### 4.2 安装 oh-my-opencode

```bash
# 克隆配置仓库
git clone https://github.com/code-yeongyu/oh-my-opencode.git ~/.config/opencode/oh-my-opencode

# 或者使用安装脚本
curl -L https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/main/install.sh | sh

# 更新配置
opencode config set plugin "oh-my-opencode"
```

### 4.3 配置文件

```json
// ~/.config/opencode/oh-my-opencode.json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "enabled": true,
  "plugins": {
    "enabled": [
      "skills",
      "agents",
      "memory",
      "commands"
    ]
  },
  "agents": {
    "default": {
      "model": "claude-sonnet-4-20250514",
      "skills": ["code", "write", "research"]
    },
    "research": {
      "model": "claude-haiku",
      "skills": ["search", "read"]
    }
  },
  "skills": {
    "directories": [
      "~/opencode-skills",
      "~/.config/opencode/skills"
    ]
  }
}
```

---

## 5. Skills 自定义技能

### 5.1 Skills 概述

Skills 是 oh-my-opencode 的核心功能，允许你定义可复用的 AI 能力。

```
Skill 结构：
skill-name/
├── skill.yaml      # 技能定义
├── instructions.md # 指令文档
├── scripts/        # 辅助脚本
├── resources/     # 参考资源
└── config.json    # 配置
```

### 5.2 创建自定义 Skill

#### skill.yaml 示例

```yaml
name: react-developer
description: React 开发专家技能
version: 1.0.0
capabilities:
  - create-react-component
  - fix-react-bug
  - optimize-react-code
trigger_keywords:
  - "React"
  - "组件"
  - "useState"
  - "useEffect"
```

#### instructions.md 示例

```markdown
# React 开发专家

你是一位资深的 React 开发专家。

## 核心能力
- 创建 React 组件
- 修复 React 问题
- 性能优化

## 代码规范
- 使用 TypeScript
- 遵循 Hooks 规则
- 组件拆分合理

## 输出格式
- 组件文件：.tsx
- 样式文件：.css 或 .module.css
- 测试文件：.test.tsx
```

### 5.3 常用预设 Skills

| Skill | 功能 | 用途 |
|-------|------|------|
| **code** | 代码编写 | 编程任务 |
| **write** | 内容写作 | 文档创作 |
| **research** | 研究分析 | 信息搜集 |
| **review** | 代码审查 | 代码检查 |
| **refactor** | 重构优化 | 代码改进 |
| **test** | 测试编写 | 单元测试 |

---

## 6. MCP 集成

### 6.1 MCP 配置

```json
// ~/.config/opencode/mcp.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
    },
    "github": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### 6.2 常用 MCP 服务器

| 服务器 | 功能 | 安装命令 |
|--------|------|----------|
| **filesystem** | 文件系统 | npx @modelcontextprotocol/server-filesystem |
| **github** | GitHub API | npx @modelcontextprotocol/server-github |
| **brave-search** | 网页搜索 | npx @modelcontextprotocol/server-brave-search |
| **puppeteer** | 浏览器 | npx @modelcontextprotocol/server-puppeteer |
| **sqlite** | 数据库 | npx @modelcontextprotocol/server-sqlite |
| **exa-search** | AI 搜索 | npx @exa/mcp-server |

### 6.3 自定义 MCP 工具

```python
# 创建自定义 MCP 服务器
from mcp.server import Server

app = Server("custom-tools")

@app.tool()
async def custom_function(param: str) -> str:
    """自定义工具描述"""
    return f"处理: {param}"

if __name__ == "__main__":
    app.run()
```

---

## 7. 高级配置与技巧

### 7.1 多模型配置

```json
// 支持多个模型并自动切换
{
  "models": {
    "default": {
      "provider": "anthropic",
      "name": "claude-sonnet-4-20250514"
    },
    "fast": {
      "provider": "anthropic",
      "name": "claude-haiku-20240307"
    },
    "local": {
      "provider": "ollama",
      "name": "llama3"
    }
  }
}
```

### 7.2 代理配置

```json
{
  "agents": {
    "architect": {
      "model": "claude-opus",
      "description": "系统架构师",
      "skills": ["research", "design"]
    },
    "coder": {
      "model": "claude-sonnet", 
      "description": "代码工程师",
      "skills": ["code", "test"]
    },
    "reviewer": {
      "model": "claude-sonnet",
      "description": "代码审查员",
      "skills": ["review", "security"]
    }
  }
}
```

### 7.3 快捷命令

```json
// 自定义命令
{
  "commands": {
    "/init": {
      "description": "初始化新项目",
      "action": "create_project"
    },
    "/test": {
      "description": "运行测试",
      "action": "run_tests"
    },
    "/deploy": {
      "description": "部署项目",
      "action": "deploy"
    }
  }
}
```

---

## 8. 工作流程最佳实践

### 8.1 项目初始化

```bash
# 1. 创建项目目录
mkdir my-project
cd my-project
git init

# 2. 启动 OpenCode
opencode

# 3. 初始化项目
/init
# 选择项目类型：React, Vue, Python, etc.
```

### 8.2 日常开发流程

```
1. 任务分配
   └── 使用 /agent coder 进行编码
   └── 使用 /agent reviewer 进行审查

2. 代码开发
   └── 描述需求
   └── AI 生成代码
   └── 审查修改

3. 测试验证
   └── /test 运行测试
   └── 修复问题

4. 提交代码
   └── Git 提交
```

### 8.3 研究任务流程

```bash
# 1. 使用研究代理
opencode
/use research

# 2. 执行研究
"研究 React Server Components 的最佳实践"

# 3. 获取报告
# AI 会：
# - 搜索相关资料
# - 分析文档
# - 总结发现
```

---

## 9. 故障排除

### 9.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| API Key 无效 | 配置错误 | 检查环境变量 |
| 模型不支持 | 版本问题 | 更新配置 |
| 权限被拒 | 权限设置 | 检查 allow 列表 |
| 连接超时 | 网络问题 | 使用 VPN |
| MCP 错误 | 服务未启动 | 重启服务 |

### 9.2 调试命令

```bash
# 查看详细日志
opencode --debug

# 检查配置
opencode config validate

# 测试 API 连接
opencode doctor

# 重置配置
opencode reset
```

### 9.3 更新 OpenCode

```bash
# 更新到最新版本
opencode update

# 或者手动更新
npm update -g opencode-ai
```

---

## 10. oh-my-opencode 特色功能

### 10.1 /init-deep 命令

自动生成项目层级知识库：

```bash
/init-deep                      # 分析并生成 AGENTS.md
/init-deep --create-new         # 强制重新创建
/init-deep --max-depth=2        # 限制目录深度
```

### 10.2 Memory 系统

项目级记忆功能：

```bash
# 保存重要信息
/opencode remember "项目使用 Vue 3 + Pinia"

/opencode recall "之前的架构决定"
```

### 10.3 Comment Checker

代码审查：

```bash
# 检查注释
/opencode check-comments
```

---

## 11. 总结

| 功能 | 掌握难度 | 实用价值 |
|------|----------|----------|
| 基础使用 | 1星 | 5星 |
| Skills | 2星 | 5星 |
| MCP | 3星 | 4星 |
| 多模型 | 2星 | 4星 |
| 代理系统 | 3星 | 5星 |
| 高级配置 | 4星 | 4星 |

**核心要点**：
- OpenCode 是免费开源的 Claude Code 替代
- oh-my-opencode 大幅增强功能
- Skills 系统提供无限扩展可能
- 多模型支持灵活应对不同任务
- 本地优先保护隐私

---

*文档版本：2026.03.01*
*基于 YouTube 2025-2026 OpenCode + oh-my-opencode 教程整理*
