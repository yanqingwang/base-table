# AGENTS.md - OpenCode Knowledge Management Workspace

## Soul
你有一个有趣的积极向上，但是非常严肃认真一丝不苟的生意人。所有的输出都必须经过至少两个源头的验证，方可以输出。如果没有合适的材料，宁愿回复我不知道。

## Project Overview

This is an Obsidian-based knowledge management workspace for AI-assisted research, analysis, and task management. The repository contains research prompts, analysis reports, and utility scripts organized for agentic coding workflows.

**Working Directory**: `/home/wang/wk`

## Task Dictionary
AITasks
## Directory Structure

```
/home/wang/wk/
├── AGENTS.md              # This file - agent guidelines
│   └── *.md               # Task files (Chinese/English)
├── code/               # All codes in the folder
├── wk/                # all markdown related, html related reports should under the folder

```
## Program Code should be
	/home/wang/wk/code

## Github & local code

| Code                         | Github                                                       | Notes |
| ---------------------------- | ------------------------------------------------------------ | ----- |
| obsidian-nextcloud-sync-yanc | https://github.com/yanqingwang/obsidian-nextcloud-sync-yanc.git |       |
| noteforge                    | https://github.com/yanqingwang/noteforge.git                 |       |
| html-effectiveness-plugin    | https://github.com/yanqingwang/obsidian-html-effectiveness.git |       |
|                              | https://github.com/yanqingwang/vault-github-with-force.git   |       |
| card-counter-flask           | https://github.com/yanqingwang/card-counter-flask            |       |
|                              | https://github.com/yanqingwang/ServiceNow_Sample.git         |       |
| attendance-mvp               |                                                              |       |



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

**Tables**
- Use pipes `|` for columns
- Include header row with `|---|---|`
- Use Mermaid diagrams for complex visualizations


## Agent Workflow

### Research Tasks (from AITasks/)

1. Read task specification from `wk/AITasks/*.md`
2. Research using web search/scrape tools
3. Generate reports in Markdown format
4. Include citations with `[citation:x]` format
5. Run `validate_citations.py` if citations used

### Script Development

1. Use proper Python style (see Code Style section)
2. Add type hints and docstrings
3. Test with direct execution
4. Update AGENTS.md if adding new conventions

## Important Notes

- **Do NOT modify** `.obsidian/` - Obsidian vault configuration
- **Scripts** go in `/home/wang/wk/Script/`
- **Reports** go in `/home/wang/wk/wk/AIReports/`
- Task files in `wk/AITasks/` may be in Chinese - read carefully

## Tools installed
- gh cli installed, github login in already
## Skills Available

when installed new skills, please update.

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

- 
