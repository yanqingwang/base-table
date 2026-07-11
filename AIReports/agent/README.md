# Agent Skills Files Collection

**Collection Date: 2026-06-01** | **Total: 24 files**

This directory contains markdown files of mainstream AI agent skills, downloaded from official repositories and community collections. Files cover SKILL.md format specifications, AGENTS.md standard, Cursor rules, Claude Code skills, Copilot instructions, and more.

---

## Complete File Index

| # | File Name | Source | Type | Description |
|---|-----------|--------|------|-------------|
| 1 | `anthropics-docx-SKILL.md` | [anthropics/skills](https://github.com/anthropics/skills) | Official | Microsoft Word DOCX skill (create/edit/analyze) |
| 2 | `anthropics-pptx-SKILL.md` | anthropics/skills | Official | PowerPoint PPTX skill (create/edit/design) |
| 3 | `anthropics-xlsx-SKILL.md` | anthropics/skills | Official | Excel XLSX skill (formulas/financial modeling) |
| 4 | `anthropics-pdf-SKILL.md` | anthropics/skills | Official | PDF processing skill (extract/merge/OCR) |
| 5 | `anthropics-webapp-testing-SKILL.md` | anthropics/skills | Official | Web app testing with Playwright |
| 6 | `agent-skills-spec.md` | [agentskills.io](https://agentskills.io/specification) | Standard | Agent Skills Open Standard specification |
| 7 | `agentsmd-example-AGENTS.md` | [agentsmd/agents.md](https://github.com/agentsmd/agents.md) | Standard | AGENTS.md cross-tool standard example |
| 8 | `github-copilot-agent-skills.md` | [GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) | Official | GitHub Copilot agent skills guide |
| 9 | `opencode-skills-docs.md` | [open-code.ai](https://open-code.ai/en/docs/skills) | Official | OpenCode skills configuration reference |
| 10 | `nvidia-skills-install.md` | [NVIDIA Docs](https://docs.nvidia.com/skills/advanced-install) | Official | NVIDIA skills installation guide |
| 11 | `wshobson-agents-skills-catalog.md` | [wshobson/agents](https://github.com/wshobson/agents) | Community ★36.2k | 155 skills catalog across 41 plugins |
| 12 | `awesome-cursorrules-README.md` | [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | Community ★39k | 100+ Cursor rules collection |
| 13 | `awesome-frontend-skills-README.md` | [finfin/awesome-frontend-skills](https://github.com/finfin/awesome-frontend-skills) | Community | Frontend agent skills curated list |
| 14 | `strativd-ai-skills-README.md` | [strativd/ai-skills](https://github.com/strativd/ai-skills) | Community | SKILL.md format reference & templates |
| 15 | `steipete-agent-rules-README.md` | [steipete/agent-rules](https://github.com/steipete/agent-rules) | Community ★5.7k | Rules for Claude Code/Cursor |
| 16 | `psenger-ai-agent-skills-README.md` | [psenger/ai-agent-skills](https://github.com/psenger/ai-agent-skills) | Community | Production-ready skills overview |
| 17 | `psenger-vault-scribe-SKILL.md` | psenger/ai-agent-skills | Community | Obsidian vault markdown note skill |
| 18 | `psenger-git-commit-pr-message-SKILL.md` | psenger/ai-agent-skills | Community | Git commit & PR message generation |
| 19 | `psenger-design-critique-SKILL.md` | psenger/ai-agent-skills | Community | Architecture design stress-testing |
| 20 | `psenger-agentic-skeleton-SKILL.md` | psenger/ai-agent-skills | Community | AI project scaffolding |
| 21 | `psenger-handoff-SKILL.md` | psenger/ai-agent-skills | Community | Session state handoff/snapshot |
| 22 | `psenger-handoff-schema.md` | psenger/ai-agent-skills | Community | Handoff JSON schema v2.0.0 |
| 23 | `addyosmani-frontend-ui-engineering-SKILL.md` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Community | Frontend UI engineering best practices |
| 24 | `README.md` | (this file) | Index | Complete file index and ecosystem overview |

---

## Ecosystem Overview

### Key Repositories

| Repository | Stars | Skills | Description |
|------------|-------|--------|-------------|
| [anthropics/skills](https://github.com/anthropics/skills) | 67k+ | 10+ | Official Anthropic skill specs (docx, pptx, xlsx, pdf, testing) |
| [wshobson/agents](https://github.com/wshobson/agents) | 36.2k | 155 | 41 plugin categories (K8s, LLM, Backend, Frontend, Security) |
| [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | 39k+ | 100+ | Cursor IDE rules by framework/language |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | - | 1424+ | Community skills from official teams (Anthropic, Vercel, Stripe, etc.) |
| [psenger/ai-agent-skills](https://github.com/psenger/ai-agent-skills) | - | 11 | Production-ready curated skills |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | - | Various | GitHub's community Copilot collection |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | - | Various | Vercel official agent skills |
| [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) | - | Various | Next.js official skills |

### Official Skill Repositories
- **anthropics/skills** - Anthropic's official skill repository (67k+ stars)
- **vercel-labs/agent-skills** - Vercel's official agent skills
- **vercel-labs/next-skills** - Next.js official skills
- **github/awesome-copilot** - GitHub's community Copilot collection
- **clerk/skills** - Clerk auth skills
- **supabase/agent-skills** - Supabase skills
- **prisma/skills** - Prisma ORM skills
- **expo/skills** - Expo development skills
- **sveltejs/ai-tools** - Svelte official AI tools
- **analogjs/angular-skills** - Angular skills (official)
- **nvidia/skills** - NVIDIA GPU/CUDA skills

### Agent Config File Formats

| Format | Tool | Location | Purpose |
|--------|------|----------|---------|
| **AGENTS.md** | Universal (cross-tool) | `./AGENTS.md` | Shared project context for all AI agents |
| **CLAUDE.md** | Claude Code | `./CLAUDE.md` | Claude Code specific configuration |
| **GEMINI.md** | Gemini CLI | `./GEMINI.md` | Google Gemini CLI configuration |
| **.cursor/rules/*.mdc** | Cursor IDE | `.cursor/rules/` | Cursor-specific rules with glob scoping |
| **.github/copilot-instructions.md** | GitHub Copilot | `.github/` | Copilot project instructions |
| **.windsurf/rules/*.md** | Windsurf | `.windsurf/rules/` | Windsurf IDE rules |
| **SKILL.md** | Any (on-demand) | `./.claude/skills/<name>/SKILL.md` | Reusable agent skill packages |

### Skill Installation

Most community skills can be installed via Vercel's CLI:
```bash
# Install all skills from a repo
npx skills add <owner/repo>

# Install a specific skill
npx skills add <owner/repo> --skill <skill-name>

# Install for specific agents
npx skills add <owner/repo> --skill <name> -a claude-code -a cursor

# Manual install (global)
cp -r skills/<name> ~/.claude/skills/<name>
```

### Skill Discovery Locations

| Agent | Project Skills | Global Skills |
|-------|---------------|---------------|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Codex CLI | `.agents/skills/` | `~/.agents/skills/` |

---

## References

- [Agent Skills Open Standard](https://agentskills.io/specification)
- [AGENTS.md Specification](https://github.com/agentsmd/agents.md)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [GitHub Copilot Agent Skills Docs](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [OpenCode Skills Documentation](https://open-code.ai/en/docs/skills)
- [NVIDIA Skills Documentation](https://docs.nvidia.com/skills/)
- [Awesome Copilot](https://github.com/github/awesome-copilot)
- [Awesome Agent Skills](https://github.com/VoltAgent/awesome-agent-skills)
