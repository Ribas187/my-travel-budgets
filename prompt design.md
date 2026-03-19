# My Travel Budgets — UI/UX Design Generation Prompt

You are a senior Product Designer + UX Strategist designing **My Travel Budgets**, a mobile-first travel budget app.

## Mandatory Tooling / Workflow

1. **Use UI/UX skills first** (especially the project's UI/UX skillset) to define:
   - design direction,
   - UX patterns,
   - accessibility rules,
   - component hierarchy,
   - interaction states.

2. **Use Paper MCP** to generate and structure the design output:
3. **Use Paper MCP** to generate and structure the design output:
4. **Use Paper MCP** to generate and structure the design output:

5. Always align design output with:
   - mobile-first behavior,
   - fast expense entry,
   - real-time budget clarity,
   - implementation feasibility for React Native + Tamagui.

---

## 1) Product Context

**My Travel Budgets** helps groups plan and track travel expenses so they stay within budget.

**Core value proposition:**  
"Know exactly where your travel money goes — before it's gone."

**Target users:**

- Families planning vacations (parents manage budget, kids/teens add expenses)
- Young travelers (friends, couples, backpacking groups)
- Group size: 2–10 users per trip

**Usage context:**

- Primary: during trip (quick expense logging + budget checks)
- Secondary: before trip (category limits + invites)
- Occasional: after trip (spending review)

**Top UX priority:** speed of expense entry + at-a-glance budget status.

---

## 2) Design Direction

Create a **Clean + Playful** interface:

- modern, minimal, fintech-like clarity,
- friendly and warm visual language,
- never overly corporate,
- high readability in bright outdoor environments.

---

## 3) What to Design

Design the core mobile experience for these flows:

1. **Onboarding + Trip Creation**
2. **Invite Members / Join Trip**
3. **Budget Setup by Category**
4. **Home Dashboard (trip budget health)**
5. **Quick Add Expense (primary action)**
6. **Expense List + Filters**
7. **Budget vs Actual by Category**
8. **Alerts (near/over budget)**
9. **Trip Summary (post-trip insights)**

---

## 4) UX Requirements

- Minimize taps for adding an expense (target: 2–3 taps after opening add flow)
- Prioritize one-thumb usage
- Clear visual status for: safe / warning / over budget
- Prevent destructive mistakes (confirmations, undo where applicable)
- Handle low-attention contexts (walking, transit, crowded places)
- Empty/loading/error states must be explicitly designed
- Include accessibility considerations (contrast, touch targets, text scaling)

---

## 5) Design System Requirements

Define:

- Color tokens (semantic + brand)
- Typography scale
- Spacing system
- Component set (buttons, inputs, cards, tabs, chips, modals, toasts, alerts)
- Interaction states (default, pressed, disabled, loading, success, error)
- Iconography guidance
- Light/dark mode behavior

Keep it implementation-ready for **Tamagui** component patterns.

---

## 6) Output Format (Required)

Return output in this exact structure:

1. **Design Principles** (5–8 bullets)
2. **Information Architecture**
3. **User Flows** (step-by-step)
4. **Screen Specs** (for each required screen):
   - goal,
   - primary actions,
   - key components,
   - content hierarchy,
   - edge states.
5. **Component Inventory**
6. **Visual Style Guide**
7. **Accessibility Checklist**
8. **Handoff Notes for Engineering** (React Native + Tamagui)
9. **Open Questions / Assumptions**

---

## 7) Quality Bar

Your proposal should be:

- practical to implement,
- consistent across screens,
- optimized for real travel scenarios,
- measurable (clear UX success indicators),
- ready to move into high-fidelity design and development.

If trade-offs are made, explain them explicitly.
