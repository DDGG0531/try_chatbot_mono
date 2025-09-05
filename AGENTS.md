# Repository Guidelines

## Project Structure & Module Organization
- Monorepo layout: `apps/` for runnable projects (web/CLI/bots) and `packages/` for shared libraries. Optional `services/` for integrations.
- Place tests beside code (e.g., `foo.test.ts`) and any cross‑cutting suites under `tests/`.
- Store assets under each app/package `assets/`; keep utility scripts in `scripts/`.

Example
```
apps/web/
packages/core-nlp/
services/webhook/
scripts/
tests/
```

## Build, Test, and Development Commands (pnpm)
- Prereq: pnpm 9+. Enable via `corepack enable` and ensure `pnpm -v` prints 9+.
- Install all deps: `pnpm install` — respects `pnpm-lock.yaml` and workspaces.
- Build all: `pnpm -r build` — topological build across workspace.
- Dev (all): `pnpm -r dev` — start available dev servers/watchers.
- Dev (one project): `pnpm --filter apps/web dev` — scope by path/name.
- Test all: `pnpm -r test` (coverage: `pnpm -r test -- --coverage`).
- Lint/format: `pnpm -r lint` · `pnpm -r format` (fix: `pnpm -r lint -- --fix`).
- Add deps: `pnpm --filter packages/core-nlp add zod` (dev: `-D`).

## Coding Style & Naming Conventions
- TypeScript/JavaScript: 2‑space indent, single quotes, semicolons; run Prettier and ESLint through the scripts above.
- Naming: packages kebab‑case (`core-nlp`); functions camelCase; classes/components PascalCase; files kebab‑case (`chat-router.ts`).

## Testing Guidelines
- Frameworks: Vitest or Jest (workspace‑wide via pnpm).
- Naming: colocated `*.test.ts`. Cover edge cases and error paths.
- Coverage: target ≥80% lines; gate with `--coverage` when available.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (e.g., `feat(core-nlp): add tokenizer options`). Keep messages imperative and scoped.
- PRs: include summary, rationale, screenshots (UI), linked issues. Require green CI, lint/format clean, and relevant tests.

## Security & Configuration Tips
- Never commit secrets. Use per‑app `.env.local` and load via `dotenv` or framework. Ignore `.env*` in VCS.
- Rotate provider keys and redact logs. Validate and sanitize all user inputs.
