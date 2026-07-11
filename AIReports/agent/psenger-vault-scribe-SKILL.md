# Vault Scribe Skill - psenger/ai-agent-skills

Source: https://github.com/psenger/ai-agent-skills

---
name: vault-scribe
description: "Converts transcripts, meeting notes, brainstorming sessions, strategy docs, and rough notes into polished Obsidian vault Markdown..."
---

## Workflow: Creating a Note

### 1. Analyze the Source Material
- Read the full transcript, notes, or brief carefully
- Identify core topic, intended audience, key concepts
- Note implicit structure

### 2. Generate YAML Front Matter

Note types and their `type` field:
| Type | Use Case |
|------|----------|
| article | Guides, reference docs, knowledge articles |
| how-to | Step-by-step instructional guides |
| technical | Architecture docs, RFCs, design docs |
| deep-research | Investigations with multiple sources |
| strategy | Versioned plans, strategy docs |
| meeting | Meeting notes, 1:1s, standups |
| brainstorming | Ideation sessions |

### 3. Structure the Document Body

Hierarchy: H1 → H2 → H3

Target sections:
1. Overview
2. How It Works
3. Practical Examples
4. Common Mistakes / Warnings
5. Quick-Start / Checklist
6. Further Reading & References

### 4. Apply Callout Blocks

| Callout | Use For |
|---------|---------|
| [!NOTE] | Neutral supplementary info |
| [!TIP] | Actionable best practice |
| [!IMPORTANT] | Key concept |
| [!WARNING] | Common mistake |
| [!CAUTION] | Risk or security issue |

### 5. Output Requirements
- File extension: .md
- UTF-8 encoding
- Front matter always present
- Minimum 4 sections
- No bare URLs
- Ends with abstract callout
