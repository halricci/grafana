---
name: gate-with-feature-toggle
description: Gate a Grafana change behind a feature toggle, from the registry through codegen to the Go or React call site. Use when a change must stay off until a flag is enabled. Invoke as /gate-with-feature-toggle.
disable-model-invocation: true
---

# Gate a change with a feature toggle

Register the flag, generate the clients, then read the flag at the call site. Do not hand-edit generated toggle files.

## Register the flag

Edit `standardFeatureFlags` in `pkg/services/featuremgmt/registry.go`. The file header says to run `make gen-feature-toggles` after a change. Copy the shape of an existing entry such as `canvasPanelNesting`.

`verifyFlagsConfiguration` in `pkg/services/featuremgmt/toggles_gen_test.go` rejects flags that miss these rules:

- `Name` contains a dot and each segment is lowerCamelCase, unless the flag sets `Generate.LegacyFrontend` or `Generate.LegacyGo`. Use a name like `text.cursorDemo`.
- `Owner` is set. Use an existing owner constant from `pkg/services/featuremgmt/codeowners.go`, for example `grafanaDatavizSquad` for a text-panel flag.
- `Expression` is non-empty. `"false"` keeps the flag off. Only public preview, GA, or deprecated flags may use `"true"`.
- `Stage` is not unknown. A new demo flag uses `FeatureStageExperimental`.
- `Description` has no leading or trailing space.

Set `Generate` to the clients that need a typed flag. `Generate{React: true}` covers the frontend client. Add `LegacyGo: true` only when the call site still uses the legacy Go constant and you have a reason to.

## Generate

Run `make gen-feature-toggles`. The Makefile runs the featuremgmt tests, which regenerate and then check the files. Do not edit these by hand:

- `pkg/services/featuremgmt/toggles_gen.go`
- `packages/grafana-runtime/src/internal/openFeature/openfeature.gen.ts`
- `packages/grafana-runtime/src/internal/openFeature/openfeature-types.gen.d.ts`

## Read the flag

Match the call site you are editing.

- New backend code uses OpenFeature. `pkg/services/pluginsintegration/pluginauth/pluginauth.go` does `openfeature.NewDefaultClient().Boolean(ctx, featuremgmt.FlagApppluginsLoadAppManifest, false, openfeature.TransactionContext(ctx))`. Use the generated `featuremgmt.Flag...` constant and a default of `false`.
- `FeatureToggles.IsEnabledGlobally` still appears widely, including `pkg/api/api.go`, and it is marked deprecated in `pkg/services/featuremgmt/models.go`. Do not add a new `IsEnabledGlobally` call. Leave an existing one in place unless the task is the migration.
- Frontend code for a generated flag follows `public/app/plugins/panel/text/v2/utils.ts`: `getFeatureFlagClient().getBooleanValue(FlagKeys.TextNewFeatures, false)` from `@grafana/runtime/internal`. Tests set the flag with `setTestFlags` from `@grafana/test-utils/unstable`, as in `public/app/plugins/panel/text/v2/editor/TextNGFeedbackButton.test.tsx`.
- Older frontend code still reads `config.featureToggles` from `app/core/config` (see `public/app/core/services/context_srv.ts`). Match that only when you are editing one of those call sites.

## Check

Run `go test -count=1 ./pkg/services/featuremgmt/ -run TestFeatureToggleFiles`. For a frontend gate, run the co-located Jest test with the flag on and off.
