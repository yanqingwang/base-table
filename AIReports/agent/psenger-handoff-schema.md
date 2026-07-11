# Handoff Schema v2.0.0

Source: https://github.com/psenger/ai-agent-skills

## Full Schema

```json
{
  "schema_version": "2.0.0",
  "generated_at": "<ISO 8601 UTC timestamp>",
  "task": {
    "goal": "<one sentence>",
    "acceptance_criteria": ["<testable criterion>"]
  },
  "current_state": "<one paragraph>",
  "completed_steps": ["<past tense, verifiably done>"],
  "pending_steps": ["<imperative, ordered by priority>"],
  "constraints": ["<hard limit>"],
  "discovered_issues": ["<known unfixed problem>"],
  "modified_files": [
    {
      "path": "<repo-relative path>",
      "status": "<created | modified | deleted>",
      "note": "<one-line description>"
    }
  ],
  "decisions": [
    {
      "decision": "<what was decided>",
      "rationale": "<why>",
      "alternatives_rejected": ["<option A>"]
    }
  ],
  "resume_prompt": "<ready-to-paste prompt>"
}
```

## Field Rules

- schema_version: Always "2.0.0"
- generated_at: ISO 8601 UTC
- task.acceptance_criteria: At least one, must be testable
- completed_steps: Past tense, verifiably done
- pending_steps: Imperative, ordered by priority
- modified_files: Every file the session touched
