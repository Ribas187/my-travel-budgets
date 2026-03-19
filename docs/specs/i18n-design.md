# Internationalization (i18n) — Design Spec

## Overview

Both the web and mobile apps must support multiple languages. The initial supported languages are English (en) and Brazilian Portuguese (pt-BR). The architecture must make adding new languages straightforward.

## Supported Languages

| Code | Language | Default |
|------|----------|---------|
| `en` | English | Yes |
| `pt-BR` | Brazilian Portuguese | No |

## Approach

- Use a shared translation system across web and mobile via `packages/core`
- Translation files are JSON, one per language, keyed by dot-notation paths (e.g., `travel.create.title`)
- Language detection: use browser/device locale on first visit, then persist the user's choice in local storage (web) or AsyncStorage (mobile)
- Language switcher available in the profile/settings screen
- All user-facing strings must come from translation keys — no hardcoded text in components

## File Structure

```
packages/
  core/
    src/
      i18n/
        index.ts          — helper to get translated string by key
        en.json           — English translations
        pt-BR.json        — Brazilian Portuguese translations
```

## Translation File Format

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "auth": {
    "login": "Log in",
    "magicLink": "Send magic link",
    "checkEmail": "Check your email"
  },
  "travel": {
    "myTravels": "My Travels",
    "create": "Create Travel",
    "budget": "Budget",
    "currency": "Currency",
    "startDate": "Start date",
    "endDate": "End date",
    "budgetExceeded": "Budget exceeded"
  },
  "expense": {
    "add": "Add Expense",
    "amount": "Amount",
    "description": "Description",
    "date": "Date"
  },
  "category": {
    "add": "Add Category",
    "budgetLimit": "Budget limit",
    "icon": "Icon",
    "color": "Color"
  },
  "member": {
    "add": "Add Member",
    "invite": "Invite by email",
    "guest": "Add guest",
    "owner": "Owner",
    "member": "Member"
  },
  "dashboard": {
    "title": "Dashboard",
    "spendingByPerson": "Spending by person",
    "spendingByCategory": "Spending by category",
    "totalSpent": "Total spent"
  },
  "profile": {
    "title": "Profile",
    "name": "Name",
    "language": "Language",
    "logout": "Log out"
  }
}
```

## Integration

- The `packages/ui` shared components should accept translated strings as props or use a shared hook/context
- Each app (`apps/web`, `apps/mobile`) wraps the app in an i18n provider that supplies the current locale and translation function
- Date and number formatting should respect the selected locale (use `Intl.DateTimeFormat` and `Intl.NumberFormat`)
- Currency formatting uses the travel's currency code combined with the user's locale for display

## Adding a New Language

To add a new language:
1. Create a new JSON file in `packages/core/src/i18n/` (e.g., `es.json`)
2. Add the locale code to the supported languages list in the i18n index
3. No code changes needed beyond this
