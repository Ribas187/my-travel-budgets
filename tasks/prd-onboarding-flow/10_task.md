# Task 10.0: E2E Tests

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Write Playwright E2E tests covering the full onboarding flow: wizard completion, skip flow, contextual tip interactions, and profile replay/reset functionality.

<skills>
### Standard Skills Compliance

- Playwright MCP tools for browser automation
</skills>

<requirements>
- Test full wizard completion flow (all 4 steps with trip + categories created)
- Test skip at step 1 (earliest skip)
- Test skip at step 2 (after starting but before creating trip)
- Test returning user is NOT redirected to wizard
- Test contextual tip appears on dashboard for new user with no expenses
- Test dismissing a contextual tip persists across page navigations
- Test "Replay onboarding" from profile settings triggers wizard redirect
- Test "Reset tips" from profile settings re-enables dismissed tips
</requirements>

## Subtasks

- [x] 10.1 Write E2E test: New user completes full wizard (step 1-4), lands on trip dashboard with trip and categories created
- [x] 10.2 Write E2E test: New user skips at step 1, lands on travels list, onboarding marked complete
- [x] 10.3 Write E2E test: New user skips at step 2, no trip created, onboarding marked complete
- [x] 10.4 Write E2E test: Returning user (onboarding complete) navigates normally, no wizard redirect
- [x] 10.5 Write E2E test: Dashboard shows `dashboard_first_visit` tip for user with 0 expenses, dismissing removes it
- [x] 10.6 Write E2E test: Dismissed tip does not reappear after page reload
- [x] 10.7 Write E2E test: Profile "Replay onboarding" button triggers wizard redirect
- [x] 10.8 Write E2E test: Profile "Reset tips" button re-enables tips on pages

## Implementation Details

Refer to **techspec.md** sections:
- "E2E Tests" — Playwright scenarios

Use the Playwright MCP tools (`browser_navigate`, `browser_click`, `browser_fill_form`, `browser_snapshot`, etc.) to interact with the application. Tests should run against a local dev server.

For test setup, you may need to:
- Create test users via API or seed data
- Reset user state between tests (clear onboarding state)

## Success Criteria

- All 8 E2E scenarios pass
- Tests are deterministic and don't depend on external state
- Tests cover both happy path (completion) and alternative paths (skip, replay, reset)

## Task Tests

- [x] E2E tests: All scenarios listed above pass with Playwright

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- All files created in tasks 1-9
- Playwright configuration (if exists)
- `src/apps/web/` — Web app entry point for E2E
