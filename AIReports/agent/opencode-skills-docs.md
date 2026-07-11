# OpenCode Agent Skills Documentation

Source: https://open-code.ai/en/docs/skills

Agent skills let OpenCode discover reusable instructions from your repo or home directory. Skills are loaded on-demand via the native `skill` tool.

## Place Files

Create one folder per skill name with `SKILL.md` inside.

**Search locations:**
- `.opencode/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md` (compatible)
- `~/.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

## Discovery

OpenCode walks up from CWD until reaching git worktree, loading matching `skills/*/SKILL.md` files.

## Frontmatter

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | 1-64 chars, lowercase+hyphens |
| description | Yes | 1-1024 chars |
| license | No | License name |
| compatibility | No | Environment requirements |
| metadata | No | String-to-string map |

## Name Validation
Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

## Permissions

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny"
    }
  }
}
```

Values: allow, deny, ask

## Per-Agent Override

```yaml
# In agent frontmatter:
---
permission:
  skill:
    "documents-*": "allow"
---
```
