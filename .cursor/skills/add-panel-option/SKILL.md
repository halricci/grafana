---
name: add-panel-option
description: Add a Grafana panel option through the panel CUE schema and generated types. Use when adding a field to a built-in panel's options. Invoke as /add-panel-option.
disable-model-invocation: true
---

# Add a panel option

Add one option to an existing built-in panel. Follow `.cursor/rules/grafana-frontend.mdc`. For tests, also follow `public/app/plugins/panel/AGENTS.md`.

## Steps

1. Find the panel's `panelcfg.cue`. The text panel schema is `public/app/plugins/panel/text/panelcfg.cue`. The option belongs on the `Options` interface inside `composableKinds: PanelCfg`, next to fields such as `mode` and `content`.
2. Add the field in CUE with a default. A boolean looks like `showWordCount: bool | *false`. Match the style of the fields already in that schema. Do not invent a second options struct.
3. Regenerate. `make gen-cue` runs `go generate` for `./kinds/gen.go` and `./public/app/plugins/gen.go` (see the root `Makefile`). That rewrites `panelcfg.gen.ts` next to the cue file. Do not hand-edit `panelcfg.gen.ts` or any other `*.gen.ts` file. `make gen-cue` regenerates every CUE package, so expect more than the one panel to show up in `git status`. Revert unrelated generated diffs if the generator touched files you did not mean to change and they are not required by the new field.
4. Use the generated `Options` type in the panel component. Read the new field from `props.options`. Style any new element with `useStyles2` and `css` from `@emotion/css`, as in `public/app/plugins/panel/text/v1/TextPanel.tsx`. Import controls from `@grafana/ui`.
5. Test. Extend the panel's co-located `*.test.tsx`. Render with `@testing-library/react` and assert the behavior of the new option (what it shows or hides), not that the component is defined. The text panel test is `public/app/plugins/panel/text/v1/TextPanel.test.tsx`. Run `yarn jest --no-watch <path>`.

## Visible result

The cue file contains the new field, and `panelcfg.gen.ts` exports it on `Options` after codegen. The panel test fails if the option is removed.
