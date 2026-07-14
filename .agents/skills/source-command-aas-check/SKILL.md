---
name: "source-command-aas-check"
description: "Typecheck and run the full test suite, and report failures concisely"
---

# source-command-aas-check

Use this skill when the user asks to run the migrated source command `aas-check`.

## Command Template

Run `npm run check` (TypeScript, no emit) and then `npm test` (vitest, full suite).

Report results concisely:
- If both pass, say so in one line — don't paste full output.
- If either fails, show only the failing files/tests and the relevant error output (not the full log), and give a one-line diagnosis of the likely cause per failure if it's apparent from the error.

Do not attempt fixes unless asked — this command is for status, not remediation.
