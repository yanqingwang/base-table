# NVIDIA Skills Installation Guide

Source: https://docs.nvidia.com/skills/advanced-install

## Installation

```bash
# Add a skill
npx skills add nvidia/skills --skill <skill-name>

# List available skills
npx skills add nvidia/skills --list

# Global install (available across projects)
npx skills add nvidia/skills --skill <skill-name> --agent codex --global

# Non-interactive install
npx skills add nvidia/skills --skill <skill-name> --yes
```

## Management

```bash
# List installed skills
npx skills list

# Check for updates
npx skills check

# Update all
npx skills update

# Remove a skill
npx skills remove <skill-name>
```

## Manual Fallback

Copy skill directory to agent's skills directory:

| Agent | Global skills directory |
|-------|------------------------|
| Claude Code | ~/.claude/skills/ |
| Codex | ~/.codex/skills/ |
| Cursor | ~/.cursor/skills/ |
