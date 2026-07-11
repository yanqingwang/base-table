# GitHub Copilot Agent Skills Documentation

Source: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills

## About Agent Skills

Agent skills are folders of instructions, scripts, and resources that Copilot can load when relevant to improve its performance in specialized tasks. The Agent Skills specification is an open standard, used by a range of different AI systems.

## Key Features

- Compatible with Copilot cloud agent, GitHub Copilot CLI, and agent mode in VS Code
- Skills can be community-created or official
- Install via `gh skill` command in GitHub CLI

## Skill Locations

**Project skills** (in repository):
- `.github/skills/`
- `.claude/skills/`
- `.agents/skills/`

**Personal skills** (home directory, shared across projects):
- `~/.copilot/skills/`
- `~/.agents/skills/`

## Finding Skills

- Official: https://github.com/anthropics/skills
- Community: https://github.com/github/awesome-copilot
- Install: `gh skill` command in GitHub CLI

## Supported Layers

Copilot's context system:
1. Custom Instructions (always-on)
2. Agent Skills (on-demand)
3. MCP Servers (tool access)
