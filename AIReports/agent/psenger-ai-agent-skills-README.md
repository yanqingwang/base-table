# ai-agent-skills - psenger/ai-agent-skills

Source: https://github.com/psenger/ai-agent-skills

A curated collection of production-ready AI agent skills for Claude Code, Codex, Cursor, and any tool supporting the Agent Skills Open Standard.

## Available Skills

| Skill | Type | Description |
|-------|------|-------------|
| vault-scribe | /vault-scribe | Obsidian vault Markdown notes |
| agentic-skeleton-dir-structure | /agentic-skeleton-dir-structure | Project scaffolding |
| git-commit-pr-message | /git-commit-pr-message | Commit/PR/changelog generation |
| design-critique | /design-critique | Architecture design review |
| arch-lens | /arch-lens | Codebase architecture review |
| review-api-design | /review-api-design | REST API design review |
| create-a-skill | /create-a-skill | Skill creation and testing |
| handoff | /handoff | Session state snapshot |
| export-vault-note | /export-vault-note | Obsidian note export |
| agent-os-profile-critique | /agent-os-profile-critique | Agent OS profile audit |

## Installation

Via npx:
```bash
npx skills add psenger/ai-agent-skills
# Install specific skill:
npx skills add psenger/ai-agent-skills --skill vault-scribe
```

Manual:
```bash
cp -r skills/vault-scribe ~/.claude/skills/vault-scribe
```
