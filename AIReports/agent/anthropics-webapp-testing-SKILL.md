# Web Application Testing Skill - Anthropic Official

Source: https://github.com/anthropics/skills

---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using Playwright...
license: Proprietary
---

## Decision Tree

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         ├─ Success → Write Playwright script
    │         └─ Fails → Treat as dynamic
    └─ No (dynamic webapp) → Is server already running?
        ├─ No → Run: python scripts/with_server.py --help
        └─ Yes → Reconnaissance-then-action
```

## Using with_server.py

Single server:
```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python test.py
```

Multiple servers:
```bash
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python test.py
```

## Reconnaissance-Then-Action Pattern

1. Navigate and wait for networkidle
2. Take screenshot or inspect DOM
3. Identify selectors from rendered state
4. Execute actions

## Best Practices
- Use bundled scripts as black boxes
- Use sync_playwright() for synchronous scripts
- Always close browser when done
- Add appropriate waits
