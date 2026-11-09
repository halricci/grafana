---
name: add-backend-service
description: Adds a classic Grafana backend service under pkg/services, including the root interface, implementation, Wire provider, optional background lifecycle, and feature toggle. Use when adding a backend service, a ProvideService constructor, a Wire binding, a background service, or a feature flag that gates backend behavior. Does not cover App SDK apps under apps/ or HTTP route handlers.
---

# Add a backend service

Build a classic service that Wire constructs. Follow `pkg/services/shorturls` (interface, impl, store) unless the surrounding package already uses another shape. Match that package instead of introducing a new one.

This skill is the Wire service path. A Kubernetes-style resource or anything under `apps/` uses the App SDK and `make gen-apps`. An HTTP route is not part of this skill: handlers live on a handler struct and call the service interface.

```
Progress:
- [ ] 1. Root package: interface, types, errors
- [ ] 2. Implementation and store
- [ ] 3. Wire registration and make gen-go
- [ ] 4. Background lifecycle, only if it runs between startup and shutdown
- [ ] 5. Feature toggle, only if behavior is gated
- [ ] 6. Tests for the new behavior
```

## Layout

```
pkg/services/<name>/
  service.go            # Service interface, domain types, errutil bases
  <name>impl/
    service.go          # ProvideService and business logic
    store.go            # unexported store interface and SQL implementation
  <name>test/           # fake, only when other services need one
```

`<name>impl` must be a unique package name (`shorturlimpl`, not `impl`). The root package holds everything callers need and must not import the impl package or other services. That import cycle is what this split exists to avoid.

## Root package

- Export a `Service` interface. Every method takes `context.Context` first.
- Declare `errutil` bases in the root package with `github.com/grafana/grafana/pkg/apimachinery/errutil`. Message IDs are `<servicename>.<error-name>` (`shorturl.not-found`). One base per public message. Failures that must look the same to the caller share a base.
- Construct instances with `.Errorf`. Callers check them with `Base.Is`.

## Implementation

`ProvideService` is the only constructor Wire should call. Take dependencies as parameters (`db.DB`, `*setting.Cfg`, other service interfaces). Return `(*Service, error)` when initialization can fail. Do not use `inject:""` tags, package-level singletons, or `init()` for anything other than registration.

```go
func ProvideService(db db.DB) *shorturlimpl.ShortURLService {
    return &shorturlimpl.ShortURLService{store: &sqlStore{db: db}}
}
```

- Read settings from `*setting.Cfg`. Do not add new package-level setting variables.
- Logger: `log.New("area.name")` from `pkg/infra/log`. Messages start with a capital letter. Put variables in key-value pairs, not in the message. Never log a struct that may contain a secret.
- Keep the service store-agnostic. The store is an unexported interface in the impl package. SQL stays in the store.
- Inject `github.com/grafana/grafana/pkg/infra/db.DB`. Reads and single statements use `WithDbSession`. Multi-statement writes use `InTransaction`, then `WithDbSession` on that context. Do not register `sqlstore` bus handlers.
- Wrap other returned errors with `fmt.Errorf("doing the thing: %w", err)`. A package sentinel (`ErrNotFound`) is returned as itself.
- Public service failures use the root `errutil` bases, not a fresh `fmt.Errorf`, so HTTP status and the public message stay stable.

## Wire

Register the provider in `wireBasicSet` in `pkg/server/wire_core.go`, next to the other services:

```go
shorturlimpl.ProvideService,
wire.Bind(new(shorturls.Service), new(*shorturlimpl.ShortURLService)),
```

Bind the interface callers depend on. Callers take that interface, not the concrete struct.

Then run `make gen-go`. Wire writes `pkg/server/wire_gen.go` and `pkg/server/bootstrap/wire/wire_gen.go`. Commit those files. Do not hand-edit them.

An ordinary service needs nothing else. Wire constructs it because some component already depends on the interface. Add it to `ProvideBackgroundServiceRegistry` only when nothing else requests it and it must still be constructed.

Edition-specific implementations bind in `pkg/server/wireext/oss.go`. The Enterprise override lives in the Enterprise overlay (`wireexts_enterprise.go`), which is not in the OSS tree. Do not invent that file here. When Enterprise must be able to replace the service, inject the interface (not the concrete type) and bind it in `wireext/oss.go`.

## Background service

Only when the service has work that runs from startup until shutdown.

- Implement `registry.BackgroundService`. `Run` returns when `ctx` is done.
- Implement `registry.CanBeDisabled` only when Grafana must skip `Run` under some configuration. `IsDisabled` is consulted after init. Startup work that must happen either way belongs in `ProvideService`.
- Add the service as a parameter of `ProvideBackgroundServiceRegistry` in `pkg/registry/backgroundsvcs/background_services.go` and pass that value into `NewBackgroundServiceRegistry(...)`. A blank `_ *Service` parameter constructs it and does not start it. A running service must be passed through.

## Feature toggle

Only when the behavior is actually optional. Edit `standardFeatureFlags` in `pkg/services/featuremgmt/registry.go`. Copy an existing entry. Set `Name`, `Description`, `Stage`, `Owner`, `Expression`, and `Generate`.

- `Owner` is an existing `codeowner` constant in `pkg/services/featuremgmt/codeowners.go`.
- `Expression` is required. `"false"` is off by default, `"true"` is on by default.
- `Stage` is `FeatureStageExperimental` unless the user named a later stage.
- `Generate` lists the clients that need a constant. Backend-only flags set `LegacyGo: true` (and `Go` when the new client is required). Do not set frontend targets for a backend-only flag.

Run `make gen-feature-toggles`. It regenerates the toggle files by running the featuremgmt tests. Commit the generated files. Do not hand-edit `toggles_gen.go`.

Evaluate with OpenFeature. `FeatureToggles.IsEnabled` and `IsEnabledGlobally` are deprecated.

```go
openfeature.NewDefaultClient().Boolean(ctx, "yourFlag", false, openfeature.TransactionContext(ctx))
```

Flags that must be known at process start belong in `setting.Cfg`, not in a toggle.

## Database schema

A new table or column is a last resort. Schema added through `pkg/services/sqlstore/migrations` runs on every upgrade, cannot be rolled back, and cannot be edited after it ships. Prefer storing the data through an existing service or the app platform.

If a migration is genuinely required, add a new migration and call it from `OSSMigrations.AddMigration`. Never edit a migration that has already shipped. `TestOSSMigrationIDsGolden` pins every migration ID to `pkg/services/sqlstore/migrations/testdata/migration_ids.txt`. Stop and ask a human to regenerate that file. Do not regenerate it yourself. The golden file exists so a person decides the migration is warranted.

## Tests

Use the standard `testing` package and `testify`. `require` stops the test. `assert` does not. Assert the result that matters (the stored row, the returned error base, the flag branch), not that a function returned without panicking.

- A package that touches the database defines `TestMain` once and calls `testsuite.Run(m)` from `pkg/tests/testsuite`.
- Integration tests are named `TestIntegration...` and call `testutil.SkipIntegrationTestInShortMode(t)`.
- Put a fake in `<name>test` when other services need to construct this one in their tests.

Run the package:

```bash
go test -count=1 ./pkg/services/<name>/...
```

## Do not

- Hand-edit `wire_gen.go`, `bootstrap/wire/wire_gen.go`, or `toggles_gen.go`.
- Add the service to the background registry when another component already depends on it and it does not run in the background.
- Put HTTP handlers, route registration, or access-control declarations in the service package.
- Log request bodies, credentials, or whole config structs.
