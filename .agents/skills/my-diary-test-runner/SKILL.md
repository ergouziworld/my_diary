---
name: my-diary-test-runner
description: Validate the my_diary Next.js project after code changes. Use when the user asks to run tests, check whether my_diary still builds, verify TypeScript/Prisma changes, or produce a concise local validation report for this repository.
---

# My Diary Test Runner

## Workflow

Use this skill only inside the `my_diary` repository.

1. Inspect `package.json` before running commands. Prefer existing scripts over inventing new ones.
2. Treat this project as a Next.js 15 + Prisma + SQLite + NextAuth app.
3. Run checks from light to heavy:
   - `npm run prisma:generate`
   - `npx tsc --noEmit`
   - `npm run build`
4. Run lint only when the user asks for lint, or when `package.json` has a known-good lint script. In this project, `npm run lint` maps to `next lint`, which may be stale for newer Next versions.
5. If a command fails, stop, capture the first meaningful error, and explain the likely layer: Prisma generation, TypeScript, Next build, environment variable, or dependency/runtime mismatch.
6. Never deploy, restart PM2, modify the database, or touch live server state as part of this skill unless the user explicitly asks.

## Script

Use `scripts/run-my-diary-checks.ps1` for repeatable local validation:

```powershell
& .\.agents\skills\my-diary-test-runner\scripts\run-my-diary-checks.ps1
```

Useful options:

```powershell
& .\.agents\skills\my-diary-test-runner\scripts\run-my-diary-checks.ps1 -SkipBuild
& .\.agents\skills\my-diary-test-runner\scripts\run-my-diary-checks.ps1 -IncludeLint
```

## Output

Report:

- Which checks ran.
- Which check failed first, if any.
- The command needed to reproduce the failure.
- A short next step tied to the failing file or subsystem.
