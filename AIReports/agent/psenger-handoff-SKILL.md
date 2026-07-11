# Handoff Skill - psenger/ai-agent-skills

Source: https://github.com/psenger/ai-agent-skills

---
name: handoff
description: "Saves or loads a structured JSON snapshot of session state so work can resume cleanly in a new session or be delegated to a sub-agent..."
---

## CREATE Workflow

### Step 1 — Determine Output File
Default: `.claude/handoffs/YYYY-MM-DD-HHMMSS-<slug>.json`

### Step 2 — Analyze the Session
Extract:
- Primary goal and acceptance criteria
- All architectural decisions with rationale
- Completed work
- Pending work in priority order
- Hard constraints
- Known bugs and issues
- Modified files

### Step 3 — Write the Handoff File
JSON format following schema in references/.

### Step 4 — Confirm and Guide

## RESUME Workflow

### Step 1 — Locate the File
### Step 2 — Load and Orient
### Step 3 — Begin Work
Start immediately with pending_steps[0]. Keep constraints and decisions visible.
