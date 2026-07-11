# AI Skills - strativd/ai-skills

Source: https://github.com/strativd/ai-skills

A curated collection of Agent Skills (SKILL.md standard) following the Agent Skills specification.

## Repository Structure

```
ai-skills/
├── skills/          # Custom skills
├── spec/            # Agent Skills specification reference
└── template/        # Template for creating new skills
```

## SKILL.md Format

### Required Frontmatter
```yaml
---
name: skill-name
description: A clear description of what this skill does and when to use it
---
```

### Optional Frontmatter Fields
```yaml
---
name: my-skill
description: Does something useful
license: Apache-2.0
compatibility: Requires git and docker
metadata:
  author: your-name
  version: '1.0'
allowed-tools: Bash(git:*) Read
---
```

## Creating a Skill

1. Create directory in `skills/` with lowercase-hyphenated name
2. Copy `template/SKILL.md` as starting point
3. Fill in required frontmatter (name, description)
4. Write instructions in markdown body
5. Optionally add scripts/, references/, assets/

## Progressive Disclosure

1. Metadata (~100 tokens): name + description
2. Instructions (< 5000 tokens): SKILL.md body
3. Resources (as needed): scripts, references, assets

## Validation
```bash
skills-ref validate ./skills/my-skill
```
