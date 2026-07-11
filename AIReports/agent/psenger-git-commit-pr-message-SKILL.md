# Git Commit & PR Message Skill - psenger/ai-agent-skills

Source: https://github.com/psenger/ai-agent-skills

---
name: git-commit-pr-message
description: "Generate git commit messages, PR titles/descriptions, and changelog entries..."
---

## 9-Step Workflow

### Step 0 — Tooling Detection
Check for `gh` CLI and GitHub MCP availability.

### Step 1 — Gather Context
- git diff --cached --stat
- git log --oneline -20
- git branch --show-current

### Step 2 — Sensitive Content Scan (MANDATORY)
Scan for: API keys, tokens, passwords, private keys, connection strings, env values, internal URLs.

### Step 3 — Ask for Ticket Reference
GitHub Issues: `#42`, Jira: `PROJ-1234`

### Step 4 — Generate Commit Message
Format: `<type>(<scope>): <short summary>`

Types: feat, fix, docs, test, refactor, perf, chore, style, ci, build

### Step 5 — Create the Commit
Always ask user confirmation first.

### Step 6 — Update Changelog
Follow Keep a Changelog v1.1.0 format.

### Step 7 — Push (If Requested)
### Step 8 — Pull Request (If Requested)
### Step 9 — Release Changelog (If Requested)

## Behavioral Rules
1. Never commit without user confirmation
2. Never skip sensitive content scan
3. Never include Co-Authored-By lines
4. Never push/PR without being asked
5. Keep subject lines under 72 characters
