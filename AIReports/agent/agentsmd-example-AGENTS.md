# AGENTS.md Example - agentsmd/agents.md (Open Standard)

Source: https://github.com/agentsmd/agents.md

This is the official AGENTS.md file from the agentsmd/agents.md repository, demonstrating the cross-tool standard format.

## Structure
AGENTS.md is an open standard for providing context to AI coding agents. Think of it as a README specifically designed for AI assistants.

### Compatible Tools
- Cursor - Full native support
- Zed - Built-in recognition
- GitHub Copilot - Workspace context
- Windsurf - Automatic loading
- Claude Code - Supported via CLAUDE.md reference
- OpenAI Codex - Native support

### Format
AGENTS.md uses plain Markdown with optional YAML frontmatter. No special syntax required.

### Key Sections to Include
1. Project Overview - what the project does
2. Tech Stack - languages, frameworks, tools
3. Coding Standards - naming, patterns, conventions
4. Commands - build, test, lint commands
5. Boundaries - what not to modify

### Example Content
```markdown
# Project: My SaaS App
## Stack
- Next.js 15 (App Router), TypeScript strict, Tailwind CSS
- Database: Postgres via Prisma

## Commands
- Build: npm run build
- Test: npm test
- Lint: npm run lint

## Boundaries
- Never modify files in migrations/
- No new dependencies without justification
```
