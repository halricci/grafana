---
name: grafana-review-conventions
description: Grafana monorepo code review conventions for the Go backend (Wire DI, sqlstore, services, errors, logging), frontend (Redux Toolkit, Emotion, i18n, a11y), generated-code pairs, migrations, and PR hygiene. Use when reviewing Grafana code changes or when asked which conventions a change must follow.
---

# Grafana Review Conventions

Repo-specific rules a change must satisfy. Each rule names the signal to look for in a diff. This skill is knowledge, not workflow: the caller decides what to do with violations. It is read by the `grafana-pr-review` skill and the reviewer subagents.

## Generated-code pairs

If the left side changes, the right side must change in the same PR, or the PR must state that generation is deferred.

| Hand-written change | Must regenerate |
|---------------------|-----------------|
| Service constructors / `pkg/server/wire.go` | `wire_gen.go` via `make gen-go` |
| `kinds/` CUE schemas | Go + TS types via `make gen-cue` |
| `pkg/services/featuremgmt/registry.go` | Toggle files via `make gen-feature-toggles` |
| API handler swagger comments | Specs via `make swagger-gen` |
| New Go module / `go.mod` in a workspace member | `go.work.sum` via `make update-workspace` |
| App SDK kinds under `apps/*/kinds/` | Via `make gen-apps` |
| New user-facing strings | i18n catalogs via `make i18n-extract` |

## Go backend (`pkg/`, `apps/`)

- **Business logic placement**: Logic belongs in `pkg/services/<domain>/`, not in `pkg/api/` handlers. A fat handler is a finding.
- **Interfaces**: Services define their interface in their own package, and consumers depend on the interface. New concrete cross-package dependencies are a smell.
- **Database access**: Use `sqlstore` sessions with parameterized queries. String-concatenated SQL is blocking. Dialect-specific SQL must go through the dialect helpers (`migrator.Dialect`), because Grafana must run on SQLite, MySQL, and Postgres.
- **Errors**: Use `errutil` for API-facing errors so status codes and public messages are structured. Never return raw `err.Error()` to clients.
- **Logging**: Use `pkg/infra/log` with structured key-value pairs. No `fmt.Println`, and no secrets, tokens, or passwords in log fields.
- **Context**: `context.Context` is the first parameter and is propagated end to end. No `context.Background()` inside request paths.
- **Build tags**: OSS code must compile without `enterprise` or `pro` tags. OSS paths importing enterprise-only packages are blocking.
- **New API endpoints**: Update the existing tests for that service (repo rule), put RBAC evaluators on the route, and add swagger annotations.

## Database migrations (`pkg/services/sqlstore/migrations/`)

- Append-only: never edit or reorder a migration that may have shipped.
- Migration IDs must be unique and descriptive.
- Must work on SQLite, MySQL, and Postgres. Check for dialect-specific syntax used raw.
- Large-table operations (index builds, column type changes on `dashboard`, `alert_rule`, etc.) need a note on lock behavior for big enterprise installs.
- Never assume data volume. A migration that loads a whole table into memory is a finding.

## Frontend (`public/app/`, `packages/`)

- **State**: Use Redux Toolkit slices and RTK Query. New handwritten thunks or reducers in old-Redux style are a finding.
- **Styling**: Use Emotion via `useStyles2(getStyles)` with theme tokens. Hardcoded colors or px values that exist as theme tokens are findings. No new `.scss`.
- **i18n**: User-visible strings use `t()` or `<Trans>` from `@grafana/i18n`. Raw string literals in JSX are findings.
- **Components**: Prefer `@grafana/ui` primitives over hand-rolled equivalents.
- **a11y**: Interactive elements need accessible names. Icon-only buttons need `aria-label`. No `div` click handlers where a button belongs.
- **Public API of `packages/`**: `@grafana/data`, `ui`, `runtime`, and `schema` are consumed by external plugins. Changes to their exported surface are breaking-change territory (see the `grafana-breaking-changes` skill).
- **Betterer**: Lint debt is tracked in `.betterer.results`. New code must not add to it (for example, new `any` or missing a11y attributes).
- **Tests**: Use React Testing Library and query by role or label rather than test-id where possible. Use MSW for API mocking.

## PR hygiene

- Frontend and backend ship as separate PRs because they deploy on different cadences. Mixed PRs need justification.
- Feature work that changes existing behavior lands behind a feature toggle.
- No links (Slack, Jira, GitHub) in code comments. Comments explain *why*, not *what*.
- User-facing changes need a `docs/` update following `docs/AGENTS.md`.
- Check `.github/CODEOWNERS` for required team sign-off on touched paths.

## Directory-scoped overrides

These AGENTS.md files override the rules above for their subtree. Read them when the diff touches those paths:

- `pkg/storage/unified/AGENTS.md`
- `public/app/features/alerting/unified/AGENTS.md`
- `docs/AGENTS.md`
