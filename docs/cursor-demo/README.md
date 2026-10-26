---
title: Cursor 201 demo
---

# Cursor 201 demo

Walkthrough config for this Grafana fork. Each section lists the files, the prompt to paste into Agent, and the result you should see. Docs for the file formats are at [cursor.com/docs/rules](https://cursor.com/docs/rules), [cursor.com/docs/skills](https://cursor.com/docs/skills), [cursor.com/docs/hooks](https://cursor.com/docs/hooks), and [cursor.com/docs/subagents](https://cursor.com/docs/subagents).

Checked out branch for the demo is `cursor-201-demo`. The small proof that a rule is followed is a second pull request into that branch.

## Rules

Files:

- `.cursor/rules/grafana-repo.mdc` is always applied (`alwaysApply: true` only).
- `.cursor/rules/grafana-go-backend.mdc` is auto-attached. Globs are `pkg/**/*.go`.
- `.cursor/rules/grafana-frontend.mdc` is auto-attached. Globs are `public/app/**/*.ts, public/app/**/*.tsx`.
- `.cursor/rules/grafana-wire-di.mdc` is agent-requested. It has a description, `alwaysApply: false`, and no globs.

The rules page does not document a file that sets both `description` and `globs`. These four files each use one documented combination. Brace globs such as `*.{ts,tsx}` are not in the glob examples, so the frontend rule uses a comma-separated pair.

Prompt:

```text
Read pkg/tsdb/grafana-testdata-datasource/usa_stats.go. Change the two fmt.Errorf calls that use %v so they wrap the error with %w. Do not change the message text. Do not open a pull request.
```

Result: a diff where both calls use `%w`. The Go rule is the one that requires that. The proof pull request into `cursor-201-demo` is that change, plus a test that `errors.Unwrap` returns the parse error.

Prompt:

```text
In public/app/plugins/panel/text/v1/TextPanel.tsx, which styling hook does the component use? Answer from the frontend rule that matches this file, and quote that rule's globs.
```

Result: `useStyles2` from `@grafana/ui`, and the globs `public/app/**/*.ts, public/app/**/*.tsx`.

## Skills

Folders, each with `SKILL.md`. `name` matches the folder. `disable-model-invocation: true` means the skill loads when you type the slash name.

- `/add-backend-endpoint` is `.cursor/skills/add-backend-endpoint/SKILL.md`.
- `/add-panel-option` is `.cursor/skills/add-panel-option/SKILL.md`.
- `/gate-with-feature-toggle` is `.cursor/skills/gate-with-feature-toggle/SKILL.md`.

Prompt:

```text
/add-panel-option Add an optional boolean showWordCount (default false) to the Text panel Options in public/app/plugins/panel/text/panelcfg.cue. Do not hand-edit panelcfg.gen.ts. Show the cue diff and the make gen-cue command. Do not commit.
```

Result: the new field on `Options` in `panelcfg.cue`. `make gen-cue` rewrites `panelcfg.gen.ts` and other CUE output. It is slow. Stop after the cue diff if you only need the skill to show up.

Prompt:

```text
/gate-with-feature-toggle Where would a new experimental flag named text.cursorDemo be registered, which command regenerates the clients, and how does public/app/plugins/panel/text/v2/utils.ts read a flag? Do not edit files.
```

Result: `pkg/services/featuremgmt/registry.go`, `make gen-feature-toggles`, and `getFeatureFlagClient().getBooleanValue`.

## Hooks

`.cursor/hooks.json` is schema version 1. Project hooks run from the repo root. Commands are `.cursor/hooks/...`.

- `afterFileEdit` runs `.cursor/hooks/format-edited.sh`. It runs `gofmt -w` on a `.go` file and `prettier --write` on `.ts` and `.tsx` when `node_modules/.bin/prettier` is installed. Stdout is `{}`. The script exits 0 even when the formatter is missing.
- `preToolUse` with matcher `Write|StrReplace|Delete|Edit` runs `.cursor/hooks/block-generated.sh`. It denies `wire_gen.go`, `*_gen.go`, `*.gen.ts`, `zz_generated*`, and paths under `vendor/`, `node_modules/`, or `public/build/`.

The hooks page says `afterFileEdit` has no output fields, and that a `preToolUse` matcher is compared to the tool name. The documented tool names include `Write` and `Delete`. This agent also edits through StrReplace, so the matcher includes `StrReplace` and `Edit`. If a build reports the edit tool under another name, this hook does not run for it. The `tool_input` path key for Write is not listed in the docs. The script checks `path`, `file_path`, `target_file`, and `filePath`, and allows the edit when none of those is present.

Prompt:

```text
Add a file pkg/tsdb/grafana-testdata-datasource/cursor_demo_format.go with package testdatasource and a function whose body is not gofmt'd (the return keyword at column 0). Leave it in the working tree.
```

Result: `gofmt` indent the function. The hook writes that. Delete the file when you are done. It is not part of the demo branch.

Prompt:

```text
Add a comment to the top of pkg/server/wire_gen.go that says demo. Do not work around a denial.
```

Result: the edit denied, with the hook's message that the file is generated. `wire_gen.go` stays unchanged.

## Subagents

Files under `.cursor/agents/`. Invoke with `/name` in the prompt. `model` is `inherit`.

- `/go-reviewer` is `.cursor/agents/go-reviewer.md`. `readonly: true`.
- `/frontend-test-writer` is `.cursor/agents/frontend-test-writer.md`. It can edit tests.
- `/grafana-explorer` is `.cursor/agents/grafana-explorer.md`. `readonly: true`.

Prompt:

```text
/grafana-explorer Where is the Time series panel's orientation option read, and where would an editor control for it be registered? Do not edit files.
```

Result: `public/app/plugins/panel/timeseries/TimeSeriesPanel.tsx` and `module.tsx`, and no file changes.

Prompt:

```text
/go-reviewer Review the uncommitted diff. Report whether returned errors use %w and whether any wire_gen.go file was edited.
```

Result: a short review that cites the Go rule and does not change files.

## Factory

The template and the four ticket prompts are in `docs/cursor-demo/factory.md`. Project HD is on fe-anysphere-demo.atlassian.net. Do not transition the tickets.

Prompt (two agents, no shared files):

```text
Paste the HD-3 prompt from docs/cursor-demo/factory.md into one cloud agent and the HD-8 prompt into another. Start both from main.
```

Result: two pull requests. HD-3 only touches `public/app/core/components/RolePicker/`. HD-8 only touches `public/app/features/transformers/calculateHeatmap/`.

HD-2 and HD-4 have their own prompts in that file. HD-4 is the one that can take longer than a few minutes, because the night region is an OpenLayers `DayNight` source and the existing tests assert layer counts.

## Uncertainties

- Cloud agents load `.cursor/hooks.json` once the environment is writable. They do not run hooks on an early read-only turn. `sessionStart` does not run in cloud agents. Prompt hooks do not run there. User-level `~/.cursor/hooks.json` does not run there.
- Whether a `beforeShellExecution` deny of `git push` also stops the pull-request action is a separate experiment. It is not configured on this branch. The result is in the demo pull request.
- `make gen-cue` and `make gen-feature-toggles` rewrite files outside a single feature. The skills name those commands. A live demo can stop before running them.
