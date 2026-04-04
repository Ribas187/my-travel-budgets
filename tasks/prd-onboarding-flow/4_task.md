# Task 4.0: InlineTip & TooltipTip UI Components

<critical>Read the prd.md and techspec.md files in this folder; if you do not read these files, your task will be invalid</critical>

## Overview

Create two reusable tip components in `@repo/ui` as molecules: `InlineTip` (dismissible card) and `TooltipTip` (anchored bubble). Both use Tamagui's `AnimatePresence` for enter/exit animations and are fully accessible.

<skills>
### Standard Skills Compliance

- `tamagui` — Styled components, AnimatePresence, design tokens
- `atomic-design-fundamentals` — Molecules layer
- `react` — Functional components, proper prop types
</skills>

<requirements>
- `InlineTip`: Dismissible card with icon, text (i18n key), optional CTA button, "X" dismiss button
- `TooltipTip`: Bubble anchored to a ref, auto-positions top/bottom, "Got it" dismiss button
- Both animate with `AnimatePresence` — fade + slide up on enter, fade + slide down on exit
- Both accessible: keyboard dismissible (Escape), screen reader announced, sufficient contrast
- Both use Tamagui styled components and design tokens (no hardcoded colors/sizes)
- Export from `@repo/ui` barrel
</requirements>

## Subtasks

- [x] 4.1 Create `src/packages/ui/src/molecules/InlineTip/InlineTip.tsx` — card with icon, text, optional CTA, dismiss X
- [x] 4.2 Create `src/packages/ui/src/molecules/TooltipTip/TooltipTip.tsx` — positioned bubble with text and "Got it" button
- [x] 4.3 Add AnimatePresence enter/exit animations to both components (enterStyle: opacity 0, y 10; exitStyle: opacity 0, y -10)
- [x] 4.4 Implement auto-positioning for TooltipTip (measure anchor, determine top/bottom placement)
- [x] 4.5 Add accessibility: `role="status"`, `aria-live="polite"`, keyboard dismiss (Escape), focusable dismiss button
- [x] 4.6 Export both components from `@repo/ui` barrel
- [x] 4.7 Write component tests

## Implementation Details

Refer to **techspec.md** sections:
- "UI Component Design" — InlineTip and TooltipTip props and behavior

For AnimatePresence, wrap the tip content in `<AnimatePresence>` and use `enterStyle`/`exitStyle` on the animated `View`. See existing Tamagui animation patterns in the codebase.

TooltipTip positioning: use a layout measurement callback to get the anchor's position, then render the bubble above or below based on available viewport space.

## Success Criteria

- InlineTip renders card with text, dismiss works, CTA button triggers callback
- TooltipTip renders anchored bubble, positions correctly, dismiss works
- Both animate in/out smoothly
- Both pass accessibility checks (keyboard navigation, screen reader)
- Components render in both web and mobile contexts (Tamagui cross-platform)

## Task Tests

- [x] Unit tests: InlineTip renders message text, dismiss button calls onDismiss, CTA button calls onCtaPress
- [x] Unit tests: InlineTip without CTA does not render CTA button
- [x] Unit tests: TooltipTip renders message text, "Got it" button calls onDismiss
- [x] Unit tests: Both components are accessible (role, aria attributes)

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant files

- `src/packages/ui/src/molecules/` — Existing molecules for reference
- `src/packages/ui/src/quarks/tamagui.config.ts` — Design tokens
- `src/packages/ui/src/index.ts` — Barrel export
