# Frontend UI Engineering Skill - addyosmani/agent-skills

Source: https://github.com/addyosmani/agent-skills

---
name: frontend-ui-engineering
description: Builds production-quality UIs. Use when building or modifying user-facing interfaces...
---

## Overview
Build production-quality user interfaces that are accessible, performant, and visually polished.

## Component Architecture

### File Structure
```
src/components/TaskList/
  TaskList.tsx          # Component
  TaskList.test.tsx     # Tests
  use-task-list.ts      # Custom hook
  types.ts              # Types
```

### Patterns
- Prefer composition over configuration
- Keep components focused (single responsibility)
- Separate data fetching from presentation

## State Management
```
useState → Component-specific
Lifted state → 2-3 siblings
Context → Theme, auth, locale
URL state → Filters, pagination
Server state → Remote data caching
Global store → Complex client state
```

## Avoid the AI Aesthetic

| AI Default | Production Quality |
|------------|-------------------|
| Purple/indigo everywhere | Use actual project palette |
| Excessive gradients | Flat or subtle gradients |
| Rounded everything (rounded-2xl) | Consistent border-radius |
| Generic hero sections | Content-first layouts |
| Lorem ipsum copy | Realistic content |
| Stock card grids | Purpose-driven layouts |

## Accessibility (WCAG 2.1 AA)

- Every interactive element must be keyboard accessible
- Label interactive elements that lack visible text
- Move focus when content changes
- Never show blank screens (meaningful empty/error states)

## Responsive Design
Mobile first: mobile → sm → lg breakpoints.
Test at: 320px, 768px, 1024px, 1440px.

## Loading and Transitions
- Skeleton loading (not spinners for content)
- Optimistic updates for perceived speed
