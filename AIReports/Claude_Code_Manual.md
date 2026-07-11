# Claude Code 完整使用手册

> 基于 YouTube 2024-2026 年教程整理 | 从入门到精通

---

## 目录

1. [什么是 Claude Code](#1-什么是-claude-code)
2. [安装与配置](#2-安装与配置)
3. [核心功能与工具](#3-核心功能与工具)
4. [工作流程与模式](#4-工作流程与模式)
5. [MCP 集成](#5-mcp-集成)
6. [自定义命令与技巧](#6-自定义命令与技巧)
7. [最佳实践](#7-最佳实践)
8. [故障排除](#8-故障排除)

---

## 1. 什么是 Claude Code？

### 1.1 产品定位

Claude Code 是 Anthropic 公司推出的 AI 编程助手，专门为软件开发者设计。

Claude Code 核心理念：
- 不仅仅是代码补全
- 自主理解项目结构
- 执行复杂开发任务
- 记住项目上下文
- 安全优先

### 1.2 与 Claude Desktop 的区别

| 特性 | Claude Desktop | Claude Code |
|------|----------------|-------------|
| 使用场景 | 对话/分析 | 编程开发 |
| 文件操作 | 受限 | 完全控制 |
| 终端执行 | 无 | 有 |
| 项目理解 | 基础 | 深度 |
| 自动化能力 | 有限 | 完整 |

### 1.3 核心能力

Claude Code 能做什么：

**代码生成**
- 从描述生成完整代码
- 自动创建文件
- 批量代码生成

**代码编辑**
- 读取和修改文件
- 重构现有代码
- 修复 bug

**终端操作**
- 执行命令
- Git 操作
- 安装依赖

**项目理解**
- 分析代码结构
- 理解项目架构
- 查找相关代码

**自主任务**
- 多步骤任务
- 错误处理
- 自我修正

---

## 2. 安装与配置

### 2.1 系统要求

**最低要求：**
- 操作系统：macOS / Linux / Windows (WSL)
- 内存：4GB+
- 磁盘：1GB+
- API：Anthropic API Key

**推荐配置：**
- 操作系统：macOS / Ubuntu 22.04+
- 内存：8GB+
- 网络：稳定 VPN（访问 Anthropic）
- IDE：VS Code / JetBrains

### 2.2 安装步骤

#### macOS 安装

```bash
# 方法1：npm 安装
npm install -g @anthropic-ai/claude-code

# 方法2：直接下载
curl -L https:// claude.com/code -o claude-code
chmod +x claude-code
sudo mv claude-code /usr/local/bin/

# 验证安装
claude-code --version
```

#### Linux/WSL 安装

```bash
# 安装依赖
sudo apt update
sudo apt install -y curl git

# 下载 Claude Code
curl -L https:// claude.com/code -o claude-code
chmod +x claude-code

# 移动到 PATH
sudo mv claude-code /usr/local/bin/

# 验证
claude-code --version
```

### 2.3 认证配置

```bash
# 方式1：环境变量
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# 方式2：交互式登录
claude-code login

# 方式3：配置文件
# 在项目根目录创建 .claude.json
{
  "api_key": "your-api-key"
}
```

### 2.4 配置选项

```json
// ~/.claude/settings.json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "temperature": 0.7,
  "tools": {
    "Bash": true,
    "Edit": true,
    "Write": true,
    "Read": true,
    "Glob": true,
    "Grep": true,
    "LVSSymbol": true,
    "WebFetch": true
  },
  "permissions": {
    "allow": ["*"],
    "deny": []
  }
}
```

---

## 3. 核心功能与工具

### 3.1 可用工具一览

Claude Code 提供以下核心工具：

| 工具 | 功能 | 用途 |
|------|------|------|
| **Read** | 读取文件内容 | 查看代码、配置 |
| **Write** | 创建/覆盖文件 | 生成新代码 |
| **Edit** | 编辑现有文件 | 修改代码 |
| **Bash** | 执行终端命令 | 运行脚本、安装 |
| **Glob** | 文件搜索 | 查找文件 |
| **Grep** | 内容搜索 | 查找代码 |
| **lsp_*** | 代码分析 | 理解项目结构 |
| **WebFetch** | 网页获取 | 查阅文档 |

### 3.2 文件操作工具

#### Read - 读取文件

```bash
# 读取单个文件
Read filePath: "/path/to/file.ts"

# 读取指定行范围
Read filePath: "/path/to/file.ts", limit: 50, offset: 100

# 读取目录
Read filePath: "/path/to/directory"
```

#### Write - 写入文件

```bash
# 创建新文件
Write content: "console.log('Hello')", filePath: "/path/to/app.js"

# 覆盖现有文件
Write content: "...", filePath: "/path/to/file.js"
```

#### Edit - 编辑文件

```bash
# 替换文本
edit filePath: "/path/to/file.ts", 
  oldString: "const old = 'old';", 
  newString: "const new = 'new';"

# 插入内容
edit filePath: "/path/to/file.ts",
  pos: "line_number",
  lines: ["new line 1", "new line 2"]

# 删除内容
edit filePath: "/path/to/file.ts",
  pos: "start_line#tag",
  end: "end_line#tag",
  lines: null
```

### 3.3 搜索工具

#### Glob - 文件名搜索

```glob
# 查找特定模式的文件
glob path: "/project", pattern: "**/*.ts"

# 查找多个模式
glob pattern: "src/**/*.{js,ts,tsx}"
```

#### Grep - 内容搜索

```grep
# 搜索内容
grep pattern: "function.*hello", path: "/src"

# 正则搜索
grep pattern: "class\\s+\\w+", include: "*.ts"

# 统计匹配数量
grep pattern: "TODO", path: "/project", output_mode: "count"
```

### 3.4 LSP 工具

```typescript
// 代码分析
lsp_symbols(filePath: "src/main.ts", scope: "document")

// 查找定义
lsp_goto_definition(character: 10, filePath: "src/main.ts", line: 5)

// 查找引用
lsp_find_references(includeDeclaration: true, filePath: "src/main.ts", line: 10)

// 重命名
lsp_rename(newName: "newFunctionName", filePath: "src/main.ts", line: 5, character: 10)

// 诊断
lsp_diagnostics(filePath: "src/main.ts", severity: "error")
```

---

## 4. 工作流程与模式

### 4.1 交互模式

Claude Code 支持两种主要交互模式：

#### 模式1：对话模式

```bash
# 启动对话
claude-code

# 或者指定项目
claude-code /path/to/project
```

对话命令：
- 直接描述需求
- 询问问题
- 请求解释
- 提交任务

#### 模式2：任务模式

```bash
# 执行单次任务
claude-code "创建一个新的 React 组件"

# 或者使用管道
echo "创建登录页面" | claude-code
```

### 4.2 任务执行流程

Claude Code 任务执行流程：

1. **理解需求**
   - 分析用户请求
   - 理解项目上下文

2. **制定计划**
   - 决定需要哪些工具
   - 规划执行步骤

3. **执行任务**
   - 按步骤执行
   - 处理错误

4. **验证结果**
   - 检查输出
   - 必要时修正

5. **报告完成**
   - 总结做了什么
   - 说明下一步建议

### 4.3 代理模式（Agent Mode）

Claude Code 可以作为代理自主执行复杂任务：

```bash
# 启用代理模式
claude-code --agent

# 或者在对话中
/agent
```

代理模式能力：
- 自主决策
- 多步骤任务
- 错误恢复
- 进度报告
- 确认检查点

---

## 5. MCP 集成

### 5.1 什么是 MCP？

MCP (Model Context Protocol) 允许 Claude Code 连接外部工具和服务。

### 5.2 MCP 配置

```json
// ~/.claude/mcp.json
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
    }
  }
}
```

### 5.3 常用 MCP 服务器

| 服务器 | 功能 | 安装 |
|--------|------|------|
| **filesystem** | 文件系统访问 | npx @modelcontextprotocol/server-filesystem |
| **github** | GitHub API 操作 | npx @modelcontextprotocol/server-github |
| **brave-search** | 网页搜索 | npx @modelcontextprotocol/server-brave-search |
| **puppeteer** | 浏览器自动化 | npx @modelcontextprotocol/server-puppeteer |
| **sqlite** | 数据库操作 | npx @modelcontextprotocol/server-sqlite |

---

## 6. 自定义命令与技巧

### 6.1 快捷命令

```bash
# 常用快捷键（需配置）
Ctrl+C - 取消当前任务
Ctrl+L - 清除对话
Ctrl+O - 打开项目
Ctrl+S - 保存会话

# 内置命令
/exit - 退出
/help - 帮助
/status - 状态
/projects - 项目列表
```

### 6.2 提示技巧

#### 基础技巧

**好的提示：**
- "创建一个 React 登录表单组件"
- "修复 src/auth.ts 中的登录 bug"
- "解释这个函数的作用"

**不好的提示：**
- "帮我写代码"
- "它不工作"
- "做个东西"

#### 高级技巧

```bash
# 指定代码风格
"创建一个按钮组件，使用 TypeScript，遵循 Airbnb 代码规范"

# 指定输出格式
"创建一个 API 文档，以 Markdown 格式输出"

# 提供上下文
"在现有的 Vue 3 项目中添加用户管理模块"

# 指定约束
"使用原生 JavaScript，不使用任何框架"
```

### 6.3 项目初始化

```bash
# 初始化新项目
claude-code init

# 选择项目类型
- JavaScript/TypeScript
- Python
- Rust
- Go
- 其他

# 自动安装依赖
claude-code init --install-deps
```

---

## 7. 最佳实践

### 7.1 有效使用 Claude Code

#### 1. 提供清晰的上下文

```bash
# 模糊
"帮我优化这个"

# 清晰
"优化 src/api/handler.ts 中的数据处理逻辑，
目标是减少内存占用，当前处理 10000 条数据需要 500MB 内存"
```

#### 2. 分解复杂任务

```bash
# 一次完成太多
"创建一个完整的电商系统"

# 分解步骤
"1. 首先创建数据库模型
2. 然后创建 API 路由
3. 接着创建前端组件
4. 最后集成测试"
```

#### 3. 利用项目上下文

Claude Code 会自动理解项目结构，可以直接说：
- "在现有的项目中添加支付功能"
- "使用项目中的认证模块"

### 7.2 安全最佳实践

安全注意事项：
- 不要共享 API Keys
- 谨慎使用外部代码
- 审查生成的代码
- 保护敏感数据
- 定期更新版本

### 7.3 工作流建议

推荐工作流程：

1. **日常开发**
   - 使用 Claude Code 辅助编码
   - 实时反馈

2. **代码审查**
   - 让 Claude Code 审查代码
   - 改进建议

3. **问题排查**
   - 描述问题现象
   - Claude Code 分析原因

4. **学习新代码**
   - 让 Claude Code 解释
   - 理解架构

---

## 8. 故障排除

### 8.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| API Key 错误 | 配置不正确 | 重新设置环境变量 |
| 权限被拒绝 | 文件权限问题 | 检查文件权限 |
| 超时 | 网络问题/任务复杂 | 增加超时时间或分解任务 |
| 内存不足 | 项目太大 | 使用 lsp 限制扫描范围 |
| 模型不支持 | API 版本问题 | 更新 Claude Code |

### 8.2 调试模式

```bash
# 启用详细日志
claude-code --verbose

# 查看日志
claude-code logs

# 调试特定问题
claude-code --debug
```

### 8.3 重置配置

```bash
# 重置所有配置
claude-code reset

# 清除缓存
claude-code clear-cache

# 重新认证
claude-code logout
claude-code login
```

---

## 9. 高级功能

### 9.1 多模型支持

```json
// 配置文件
{
  "models": {
    "default": "claude-3-5-sonnet-20241022",
    "fast": "claude-3-haiku-20240307",
    "research": "claude-3-opus-20240229"
  }
}
```

### 9.2 自定义提示模板

```bash
# 创建提示模板
mkdir -p ~/.claude/templates
# 在 templates 目录创建 .md 文件
```

### 9.3 集成开发环境

**VS Code 集成：**
- 安装 Claude Code 扩展
- 使用 Cmd+Shift+P 调用
- 快捷键配置

**JetBrains 集成：**
- 安装插件
- 配置 API Key
- 使用工具窗口

---

## 10. 总结

| 功能 | 掌握难度 | 实用价值 |
|------|----------|----------|
| 基础对话 | 1星 | 5星 |
| 代码生成 | 2星 | 5星 |
| 文件操作 | 2星 | 5星 |
| MCP 集成 | 3星 | 4星 |
| 自定义命令 | 3星 | 4星 |
| 代理模式 | 4星 | 5星 |

**核心要点：**
- Claude Code 是强大的 AI 编程助手
- 掌握核心工具是高效使用的基础
- 清晰的提示带来更好的结果
- MCP 扩展无限可能

---

*文档版本：2026.03.01*
*基于 YouTube 2024-2026 Claude Code 教程整理*
