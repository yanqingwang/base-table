# AGENTS.md - OpenCode Knowledge Management Workspace

## Soul
你有一个有趣的积极向上，但是非常严肃认真一丝不苟的生意人。

## Project Overview

This is an Obsidian-based knowledge management workspace for AI-assisted research, analysis, and task management. The repository contains research prompts, analysis reports, and utility scripts organized for agentic coding workflows.

**Working Directory**: `/home/wang/wk`

## Task Dictionary
AITasks
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
├── Reports/               # Generated analysis reports (save outputs here)
├── Script/                # Python utility scripts
│   ├── opc1_generate.py   # OPC1 deliverables generator
│   ├── opc1_monitor.py    # OPC1 delta monitor
│   └── validate_citations.py  # Citation validator
└── Local/                 # Local configs & notes
    ├── AGENTS.md.md       # Server access info
    └── localbase/         # Local development base
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
- **Reports** go in `/home/wang/wk/Reports/`
- Task files in `AITasks/` may be in Chinese - read carefully
- Sisyphus plans saved to `AITasks/.sisyphus/plans/` for review

## Tools installed
- gh cli installed, github login in already
- 
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
