# AGENTS.md - OpenCode Knowledge Management Workspace



## Author: 

rosswang



## Company: 

heart and road



## Guideline

| Principle             | Prevents                                                     |
| --------------------- | ------------------------------------------------------------ |
| Think Before Coding   | Silent assumptions, hidden confusion, missing tradeoffs      |
| Simplicity First      | Over-engineering, bloated abstractions, speculative features |
| Surgical Changes      | Drive-by rewrites, unrelated cleanup, accidental behavior changes |
| Goal-Driven Execution | Vague completion criteria and unverified changes             |



## Project Overview

This is an Obsidian-based knowledge management workspace for AI-assisted research, analysis, and task management. The repository contains research prompts, analysis reports, and utility scripts organized for agentic coding workflows.

**Working Directory**: `/home/wang/wk`

## Task Dictionary

AITasks

## Project folder

When create code under /home/wang/wk/code/, make the main codes and test examples in the same folder to make the project management sample.


## Work Memory
	please follow rule work.md
	/home/wang/wk/memory

## WeChat Projects Workspace (微信项目)
	微信云托管 / 小程序（次卡管家）相关工作日志、记忆、任务、产出统一存放于:
	/home/wang/wk/wechat/
	- 开发记录写入 wechat/memory/work.md（勿写入全局 memory/work.md）
	- 任务文档在 wechat/tasks/，产出在 wechat/docs/，会话日志在 wechat/logs/
	- 代码仓库保持原位: code/card-counter-flask（后端）、code/card-counter-miniapp（小程序）
	- 详见 wechat/README.md

## Documentation

This workspace includes comprehensive documentation to help you get started and troubleshoot issues:

- **SETUP.md**: Detailed setup instructions and configuration guide
- **QUICK_START.md**: Quick start guide for rapid onboarding
- **TROUBLESHOOTING.md**: Troubleshooting guide for common issues
- **README.md**: High-level overview and getting started guide

## Documentation Structure

The workspace follows a comprehensive documentation structure:

### Core Documentation
- **AGENTS.md**: Agent guidelines and configuration (this file)
- **SETUP.md**: Setup and configuration instructions
- **QUICK_START.md**: Quick start guide
- **TROUBLESHOOTING.md**: Troubleshooting guide
- **README.md**: Project overview and getting started

### Development Documentation
- **Script/**: Python scripts and utilities
- **code/**: Program code and tools
- **docs/**: Additional documentation (to be created)
- **examples/**: Usage examples (to be created)
- **templates/**: Templates (to be created)

### Knowledge Management
- **AITasks/**: Obsidian vault with research tasks
- **AIReports/**: Generated analysis reports
- **Reports/Charts/**: Generated analysis attached images
- **obplugin/**: Obsidian plugin memory copies + work results (`README.md`, `plugins.md`, `memory/`)

## Documentation Best Practices

### 1. File Naming Conventions
- **Documentation files**: Use kebab-case (e.g., `setup-guide.md`)
- **Report files**: Use kebab-case with date (e.g., `iran-conflict-analysis-2026-04-03.md`)
- **Task files**: Use descriptive names with optional dates

### 2. Content Organization
- **Use markdown** for all documentation
- **Include examples** and usage instructions
- **Document your thought process** and decisions
- **Keep documentation up to date** with code changes

### 3. Accessibility
- **Provide multiple entry points**: README, quick start, setup guide
- **Include troubleshooting**: Common issues and solutions
- **Offer examples**: Usage examples and best practices
- **Document APIs**: Function signatures and usage

## Documentation Usage

### For New Users

1. **Start with README.md** for a high-level overview
2. **Read QUICK_START.md** for rapid onboarding
3. **Refer to SETUP.md** for detailed setup instructions
4. **Use TROUBLESHOOTING.md** for common issues

### For Developers

1. **Explore AGENTS.md** for agent guidelines and configuration
2. **Check Script/** for Python utilities and scripts
3. **Review code/** for program code and tools
4. **Examine AITasks/** for research task structure

### For Administrators

1. **Review SETUP.md** for system configuration
2. **Check TROUBLESHOOTING.md** for maintenance procedures
3. **Monitor AIReports/** for generated reports
4. **Review AGENTS.md** for agent configuration

## Documentation Maintenance

### Updating Documentation

1. **Keep documentation up to date** with code changes
2. **Use version control** for all documentation changes
3. **Create pull requests** for documentation updates
4. **Review documentation** regularly for accuracy

### Documentation Quality

- **Be comprehensive**: Cover all aspects of the workspace
- **Be clear**: Use simple language and clear examples
- **Be consistent**: Follow existing style and conventions
- **Be accessible**: Provide multiple ways to find information

## Next Steps for Documentation

1. **Create additional documentation** as needed
2. **Update existing documentation** with new information
3. **Add examples** for common tasks and workflows
4. **Include troubleshooting** for common issues
5. **Document best practices** for the workspace

## Documentation Resources

- **OpenCode Documentation**: Official OpenCode documentation
- **Obsidian Documentation**: Obsidian knowledge base features
- **Python Documentation**: Python language reference
- **Node.js Documentation**: Node.js API reference
- **Git Documentation**: Git version control reference

---

*This documentation is part of the OpenCode Knowledge Management Workspace and is continuously updated to provide the best experience for users.*

## Directory Structure

```
/home/wang/wk/
├── AGENTS.md              # This file - agent guidelines
├── AITasks/               # Obsidian vault with research tasks
│   ├── .obsidian/         # Obsidian config (do NOT modify)
│   ├── .sisyphus/         # Sisyphus work plans
│   │   ├── drafts/        # Draft plans
│   │   └── plans/         # Reviewed/approved plans
│   └── *.md               # Task files (Chinese/English)
├── AIReports/               # Generated analysis reports (save outputs here)
├── Reports/Charts               # Generated analysis attached images (save outputs here)
├── obplugin/                # Obsidian plugins: memory copies + work results (README/plugins.md)
│   ├── README.md            # Plugin index + cross-vault data-loss lessons
│   ├── plugins.md           # Release history per plugin
│   └── memory/              # obsidian-plugins-work.md (copied from memory/work.md)


```


## Program Code should be

    /home/wang/wk/code

## Build/Lint/Test Commands



### Python Scripts

```bash
# Run OPC1 generator (creates CSV + markdown reports)
python Script/opc1_generate.py

# Run OPC1 monitoring (shows delta since last run)
python Script/opc1_monitor.py

# Validate citations in reports
python Script/validate_citations.py \
    --sources Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md \
    Reports/伊朗冲突全球媒体态度分析报告-2026-04-03.md

# Run a single test (if pytest configured)
pytest Script/tests/ -v -k test_name

# Lint Python code
ruff check Script/
ruff format Script/
```

### DocuSign Tools (蓝领入职 / 批量签署)

> All docusign-related code (Python, JS, configs, xlsx templates) lives in
> `/home/wang/wk/code/docusign-keys/`. Final report files stay in
> `/home/wang/wk/AIReports/`.

```bash
# 1. Get JWT access token (auto-loads .env from script directory)
python /home/wang/wk/code/docusign-keys/docusign_auth.py

# 2. Bulk send envelopes from CSV or XLSX
#    --csv and --xlsx are mutually exclusive (exactly one required)
python /home/wang/wk/code/docusign-keys/docusign_bulk_send.py \
    --template-id <TEMPLATE_GUID> \
    --csv /path/to/employees.csv \
    --role-name "Candidate" \
    --dry-run          # add to validate without sending

# Same with XLSX (recommended for 蓝领 / multi-tab templates)
python /home/wang/wk/code/docusign-keys/docusign_bulk_send.py \
    --template-id <TEMPLATE_GUID> \
    --xlsx /home/wang/wk/code/docusign-keys/templates/员工批量入职数据导入模板.xlsx \
    --role-name "Candidate"

# 3. Bulk export completed envelopes (PDFs named by employee, + form data + CSV + XLSX)
python /home/wang/wk/code/docusign-keys/docusign_bulk_export.py
python /home/wang/wk/code/docusign-keys/docusign_bulk_export.py --status sent --dry-run
python /home/wang/wk/code/docusign-keys/docusign_bulk_export.py --out-dir /path/to/exports

# 4. Run webhook server (Connect events / OAuth callback)
python /home/wang/wk/code/docusign-keys/docusign_webhook.py
# Listens on http://localhost:5000 by default

# Tracking SQLite DB: /home/wang/wk/code/docusign-keys/tracking.db
# Export output:    /home/wang/wk/code/docusign-keys/exports/{date}/
# Sample xlsx template: /home/wang/wk/code/docusign-keys/templates/员工批量入职数据导入模板.xlsx
# CDP helper scripts:   /home/wang/wk/code/docusign-keys/scripts/  (Node.js + chrome-remote-interface)
```

**XLSX support** (added 2026-06-06):
- `docusign_bulk_send.py` accepts `--xlsx` as alternative to `--csv` (auto-detected by extension)
- `docusign_bulk_export.py` writes both `employees.csv` and `employees.xlsx` (auto-sized columns, bold headers)
- Requires `openpyxl` (`pip install openpyxl`)
- First sheet's first row is treated as header; subsequent rows are data

### Chrome Devtools / playwright / agent browser

Use chromium as default, use the default profile on the computer. not use private model

### Markdown Reports

Follow obsidian standard configuration.

**File Naming**

- English: `kebab-case-{YYYY-MM-DD}.md`
- Chinese: `{中文描述}-{YYYY-MM-DD}.md`

**Report Structure**

```markdown
# Report Title

**报告日期：YYYY年MM月DD日**

---

## 执行摘要

Brief summary here...

---

## Section One

### 1.1 Subsection

Content with tables and citations...
```

**Citation Format**

- Use `[citation:x]` format where x is a number
- Maintain a Sources Inventory with numbered entries
- Validate with `Script/validate_citations.py`

**Tables**

- Use pipes `|` for columns
- Include header row with `|---|---|`
- Use Mermaid diagrams for complex visualizations

## Agent Workflow

### Research Tasks (from AITasks/)

1. Read task specification from `AITasks/*.md`
2. Research using web search/scrape tools
3. Generate reports in Markdown format
4. Save outputs to `Reports/` directory
5. Include citations with `[citation:x]` format
6. Run `validate_citations.py` if citations used

### Script Development

1. Use proper Python style (see Code Style section)
2. Add type hints and docstrings
3. Test with direct execution
4. Update AGENTS.md if adding new conventions

## Important Notes

- **Do NOT modify** `.obsidian/` - Obsidian vault configuration
- **Scripts** go in `/home/wang/wk/Script/`
- **Reports** go in `/home/wang/wk/AIReports/`
- Task files in `AITasks/` may be in Chinese - read carefully
- Sisyphus plans saved to `AITasks/.sisyphus/plans/` for review

## Tools installed

- gh cli installed, github login in already

## OpenCode Configuration

OpenCode v1.15.5 is installed as the primary AI coding agent.

### Config Files

| File           | Location                                  | Purpose                                            |
| -------------- | ----------------------------------------- | -------------------------------------------------- |
| Global config  | `~/.config/opencode/opencode.json`        | Global OpenCode settings (providers, MCP, plugins) |
| Agent config   | `~/.config/opencode/oh-my-openagent.json` | Agent roles & model assignments                    |
| Project config | `.opencode/opencode.json`                 | Project-specific overrides                         |
| Auth/creds     | `~/.local/share/opencode/auth.json`       | Provider API credentials                           |
| Skills         | `~/.config/opencode/skills/`              | Custom skill definitions                           |

### Providers

| Provider             | Status          | Models Available                                                             |
| -------------------- | --------------- | ---------------------------------------------------------------------------- |
| **DeepSeek**         | ✅ Authenticated | `deepseek-chat`, `deepseek-reasoner`, `deepseek-v4-flash`, `deepseek-v4-pro` |
| **SiliconFlow (CN)** | ✅ Authenticated | `DeepSeek-V3`, `DeepSeek-R1`, `Kimi-K2`, etc.                                |
| **OpenCode (Free)**  | ✅ Built-in      | `qwen3.6-plus-free`, `nemotron-3-super-free`                                 |

### Agent Model Allocation

Intelligent tiered model assignment by agent role:

| Tier                 | Model                        | Used By                                                                               | Cost                |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------- | ------------------- |
| **1 - Reasoning**    | `deepseek/deepseek-reasoner` | `momus` (审查), `metis` (分析), `oracle` (研究), `ultrabrain` (脑暴)                  | Paid (high quality) |
| **2 - Fast-Coding**  | `deepseek/deepseek-v4-flash` | `sisyphus` (主工作流), `hephaestus` (编码), `prometheus` (构建), `visual-engineering` | Paid (fast)         |
| **3 - Chat/Writing** | `deepseek/deepseek-chat`     | `artistry` (创作), `writing` (写作), `multimodal-looker`                              | Paid (balanced)     |
| **4 - Free**         | `opencode/qwen3.6-plus-free` | `quick` (快速), `atlas` (探索), `explore`, `sisyphus-junior`                          | **Free**            |

### MCP Servers

| Server                  | Purpose                                        | Enabled |
| ----------------------- | ---------------------------------------------- | ------- |
| **playwright**          | Browser automation (E2E testing, web scraping) | ✅      |
| **chrome-devtools**     | Chrome DevTools protocol (debugging)           | ✅      |
| **filesystem**          | Project file access (`/home/wang/wk`)          | ✅      |
| **sequential-thinking** | Enhanced reasoning chains                      | ✅      |

## Chrome devtools / agent-browser / playwright

Use the default chromium profile as the profile always.



## Skills Available

when installed new skills, please update.

### Cognitive Skills

- **huashu-nuwa** - 女娲造人：输入人名/主题/甚至只是模糊需求，自动深度调研→思维框架提炼→生成可运行的人物Skill。触发词：「造skill」「蒸馏XX」「女娲」「造人」「XX的思维方式」「做个XX视角」
- **karpathy-perspective** - Andrej Karpathy的思维框架与表达方式。基于40+一手来源，提炼4个核心心智模型、10条决策启发式。用途：AI技术分析、工程教育、开源策略、学习方法。触发词：「用Karpathy的视角」「卡帕西」「Karpathy会怎么看」「karpathy模式」「from scratch」「vibe coding」「jagged intelligence」
- **andrej-karpathy-perspective** - Same as karpathy-perspective (alternative name)
- **elon-musk-perspective** - 马斯克的思维操作系统。基于传记、播客、推文、决策记录，提炼5个核心心智模型、8条决策启发式。用途：成本结构拆解、第一性原理分析、行业假设挑战。触发词：「用马斯克的视角」「马斯克会怎么看」「第一性原理」「白痴指数」「五步算法」
- **feynman-perspective** - 理查德·费曼的思维框架。基于40+一手来源，提炼5个核心心智模型、8条决策启发式。用途：分析问题、审视决策、知识验证。触发词：「用费曼的视角」「费曼学习法」「cargo cult」「命名不等于理解」
- **munger-perspective** - 查理·芒格的思维框架。基于50+来源，提炼5个核心心智模型、8条决策启发式。用途：投资决策审视、认知偏误检查、逆向思考练习。触发词：「用芒格的视角」「逆向思考」「认知偏误」「Lollapalooza效应」「能力圈」
- **naval-perspective** - Naval Ravikant的思维操作系统。提炼5个核心心智模型、8条决策启发式。用途：财富创造、杠杆思维、特定知识、欲望管理。触发词：「用Naval的视角」「纳瓦尔模式」「杠杆」「specific knowledge」「无需许可」
- **steve-jobs-perspective** - 史蒂夫·乔布斯的思维框架。基于30+一手来源，提炼6个核心心智模型、8条决策启发式。用途：产品分析、设计决策、用户体验评估。触发词：「用乔布斯的视角」「乔布斯会怎么看」「Jobs模式」「产品直觉」
- **paul-graham-perspective** - Paul Graham的思维框架。基于200+篇essays和访谈，提炼5个核心心智模型、8条决策启发式。用途：创业分析、写作策略、产品思考、人生选择。触发词：「用PG的视角」「Paul Graham会怎么看」「创业」「essay思维」
- **zhang-yiming-perspective** - 张一鸣（字节跳动/TikTok创始人）的思维框架。基于32个访谈、12个决策案例，提炼5个核心心智模型、7条决策启发式。用途：产品、组织、全球化、人才。触发词：「用张一鸣的视角」「字节的逻辑」「一鸣的思考」「zhang yiming perspective」
- **zhangxuefeng-perspective** - 张雪峰的思维框架。基于5本著作、15+篇深度采访，提炼5个核心心智模型、8条决策启发式。用途：教育选择、职业规划、阶层流动。触发词：「用张雪峰的视角」「张雪峰会怎么看」「雪峰视角」「高考志愿」
- **sun-yuchen-perspective** - 孙宇晨(Justin Sun)的思维框架。基于1500+行调研素材，提炼6个核心心智模型、8条决策启发式。用途：营销策略、注意力经济、危机公关、叙事操控。触发词：「用孙宇晨的视角」「孙割会怎么做」「割神」「Justin Sun perspective」
- **trump-perspective** - 唐纳德·特朗普的思维框架。基于6维度320KB+原始资料，提炼6个核心心智模型、8条决策启发式。用途：谈判分析、权力解读、危机传播。触发词：「懂王视角」「特朗普会怎么看」「trump perspective」
- **taleb-perspective** - 塔勒布(Nassim Nicholas Taleb)的思维框架。基于40+来源，提炼6个核心心智模型、9条决策启发式。用途：极端风险分析、反脆弱策略、主流叙事质疑。触发词：「用塔勒布的视角」「黑天鹅」「反脆弱」「skin in the game」「尾部风险」
- **ilya-sutskever-perspective** - Ilya Sutskever的思维框架。基于论文、访谈、证词，提炼6个核心心智模型、8条决策启发式。用途：AI技术方向、安全策略、研究品味。触发词：「用Ilya的视角」「Ilya会怎么看」「sutskever perspective」
- **mrbeast-perspective** - MrBeast(Jimmy Donaldson)的内容创造操作系统。基于36页内部培训手册，提炼6个核心心智模型、8条决策启发式。用途：YouTube内容优化、标题/缩略图/Hook策略、retention优化。触发词：「用MrBeast的视角」「MrBeast会怎么做」「Beast模式」「YouTube增长」
- **x-mastery-mentor** - X/Twitter运营导师。基于6位顶级创作者方法论+X算法深度分析。用途：推特内容策略、增长技巧、AI/科技赛道专精。触发词：「X运营」「推特」「怎么涨粉」「怎么写推文」「tweet」「thread」

### Document Skills

- **documents** - Word, Excel, PowerPoint document handling
- **documents-docx** - Microsoft Word documents
- **documents-xlsx** - Microsoft Excel spreadsheets
- **documents-pptx** - PowerPoint presentations

### Development Skills

- **writing-skills** - Creating and editing skills
- **writing-plans** - Multi-step task planning
- **verification-before-completion** - Pre-commit verification
- **using-superpowers** - Skill usage framework
- **using-git-worktrees** - Isolated git worktrees
- **test-driven-development** - TDD workflow
- **subagent-driven-development** - Parallel agent execution
- **requesting-code-review** - Code review orchestration
- **receiving-code-review** - Review feedback handling
- **finishing-a-development-branch** - Branch completion
- **executing-plans** - Plan execution with checkpoints
- **dispatching-parallel-agents** - Parallel task dispatch
- **brainstorming** - Creative task exploration
- **systematic-debugging** - Bug investigation workflow

### Slash Commands

- **/documents** - Document handling
- **/playwright** - Browser automation
- **/frontend-ui-ux** - UI/UX development
- **/git-master** - Git operations
- **/dev-browser** - Browser automation
- **/review-work** - Post-implementation review
- **/ai-slop-remover** - Code smell removal
- **/refactor** - Intelligent refactoring
- **/start-work** - Work session startup
- **/handoff** - Context summary
