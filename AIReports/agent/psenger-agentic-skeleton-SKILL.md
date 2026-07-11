# Agentic Skeleton Directory Structure Skill - psenger/ai-agent-skills

Source: https://github.com/psenger/ai-agent-skills

---
name: agentic-skeleton-dir-structure
description: "Scaffolds production-ready directory structures for agentic AI projects..."
---

## 6-Step Workflow

### Step 0 — Gather Requirements (6 questions)
1. Repo Pattern: Single / Mono / Multi-Language
2. Platform Type: Frontend / Backend / Full-Stack / Middleware / Agents
3. Languages: TypeScript, Python, Go, etc.
4. IaC Tool: Terraform / Pulumi / CDK / etc.
5. Target Platform: AWS / GCP / Azure / Kubernetes
6. Agent Tooling: Claude Code / Cursor / Windsurf

### Step 1 — Scaffold Core Structure

Every project gets:
```
project-root/
├── CLAUDE.md
├── .claude/ (agents, skills, commands, hooks)
├── agent-os/ (product, specs, standards)
├── docs/ (architecture, api, runbooks)
├── iac/
├── deploy/
├── .github/
├── README.md
└── .gitignore
```

### Step 2 — Create the Scaffold
### Step 3 — Generate CLAUDE.md
### Step 4 — Seed Agent-OS Files
### Step 5 — Present Next Steps
### Step 6 — Quality Checklist

## Input Validation

| Variable | Allowed |
|----------|---------|
| PROJECT_ROOT | Alphanumeric, hyphens, underscores |
| REPO_PATTERN | single, mono, multi |
| PLATFORM | frontend, backend, fullstack, middleware, agents |
| IAC_TOOL | terraform, pulumi, cdk, bicep, cloudformation, helm, ansible, none |
