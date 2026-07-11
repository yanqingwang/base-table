# Agent Skills Open Standard Specification

Source: https://agentskills.io/specification

## Directory Structure

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
```

## SKILL.md Format

YAML frontmatter followed by Markdown content.

### Frontmatter Fields

| Field | Required | Constraints |
|-------|----------|-------------|
| name | Yes | Max 64 chars, lowercase+hyphens only |
| description | Yes | Max 1024 chars, non-empty |
| license | No | License name or reference |
| compatibility | No | Max 500 chars, environment requirements |
| metadata | No | Arbitrary key-value mapping |
| allowed-tools | No | Space-separated tool whitelist (experimental) |

### name Validation
- 1-64 characters
- Only lowercase a-z, 0-9, hyphens
- Must not start/end with hyphen
- No consecutive hyphens
- Must match parent directory name

### description Best Practices
- Describe both what the skill does AND when to use it
- Include specific keywords for agent matching

## Progressive Disclosure

1. **Metadata** (~100 tokens): name + description loaded at startup
2. **Instructions** (< 5000 tokens): SKILL.md body loaded when activated
3. **Resources** (as needed): scripts, references, assets loaded on demand

## File References
Use relative paths from skill root. Keep references one level deep.

## Validation
```bash
skills-ref validate ./my-skill
```
