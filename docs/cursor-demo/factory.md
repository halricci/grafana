---
title: Factory prompts for project HD
---

# Factory prompts for project HD

These prompts are for a Cursor cloud agent on this fork. Each one reads a Jira ticket in project HD on [fe-anysphere-demo.atlassian.net](https://fe-anysphere-demo.atlassian.net) and opens a pull request. The tickets are already in To Do. The agent must not transition, comment on, or edit the Jira issue.

The four tickets touch different directories. Run them as four agents at the same time. They do not share files.

This fork already has open pull requests that attempt two of the tickets. [PR #8](https://github.com/halricci/grafana/pull/8) attempts HD-2. [PR #5](https://github.com/halricci/grafana/pull/5) attempts HD-3. Start from `main`. Do not branch from those pull requests.

HD-4 is the one that can run longer than a few minutes. The other three are a single predicate or a panel option that the renderer already understands.

## Reusable template

Replace `HD-N` and the goal sentence, then paste the whole block into a cloud agent.

```text
You are a Cursor cloud agent on the halricci/grafana fork. Read Jira HD-N on https://fe-anysphere-demo.atlassian.net (project HD). Do not transition, comment on, or edit the Jira issue.

Goal: <one sentence from the ticket>.

Branch from main. Never commit or push to main. Implement only this ticket. Open a pull request against main. Put HD-N in the pull request body.

Stay inside the files named below. Do not regenerate Wire, CUE, or feature toggles. Verify with the command below and put the result in the pull request body.
```

## Files, side by side

- **HD-2:** `public/app/plugins/panel/timeseries/module.tsx`, plus a test under `public/app/plugins/panel/timeseries/`. The option field already exists on `Options` in `panelcfg.cue` and `panelcfg.gen.ts`. Do not edit those generated files.
- **HD-3:** `public/app/core/components/RolePicker/RolePicker.tsx`, plus a new test in that same folder. There is no test file there today. Leave `RolePickerDrawer/` alone.
- **HD-4:** `public/app/plugins/panel/geomap/layers/data/dayNightLayer.tsx` and `dayNightLayer.test.ts`.
- **HD-8:** `public/app/features/transformers/calculateHeatmap/applicability.ts` and `applicability.test.ts`. The same inverted condition is copied in `heatmap.ts` in that folder. The transformation picker does not read that copy. It reads `isHeatmapApplicable` from `public/app/features/transformers/standardTransformers.tsx`. You can update `heatmap.ts` so the two copies match. You do not need to edit `standardTransformers.tsx`.

## HD-2

Easy. The time series renderer already flips the chart when `options.orientation` is `VizOrientation.Vertical` (`TimeSeriesPanel.tsx`). Nothing registers an editor control. The bar chart radio is the pattern (`public/app/plugins/panel/barchart/module.tsx`, the `orientation` radio). `orientation` is already on the CUE schema, so do not run `make gen-cue`.

```text
You are a Cursor cloud agent on the halricci/grafana fork. Read Jira HD-2 (https://fe-anysphere-demo.atlassian.net/browse/HD-2). Do not transition, comment on, or edit the Jira issue.

Goal: add an Orientation radio (Auto / Horizontal / Vertical) to the Time series panel editor. The renderer already honors options.orientation. Saved dashboards that omit the option must keep rendering as they do today (only Vertical is a special case in TimeSeriesPanel.tsx).

Area: public/app/plugins/panel/timeseries/module.tsx setPanelOptions. Copy the radio from public/app/plugins/panel/barchart/module.tsx. The field already exists on Options in panelcfg.cue and panelcfg.gen.ts. Do not edit panelcfg.gen.ts and do not run make gen-cue or make i18n-extract. Update the stale comment in TimeSeriesPanel.tsx that says vertical orientation is not available through config.

Branch from main. Never commit or push to main. Open a pull request against main with HD-2 in the body.

Verify: yarn jest --no-watch public/app/plugins/panel/timeseries/TimeSeriesPanel.test.tsx
Add a unit test that the option is registered with a default that preserves today's horizontal render, and that the chosen orientation is what the panel reads. yarn test watches forever in this repo. Use yarn jest --no-watch.
```

## HD-3

Easy. One filter. `getOptions` in `RolePicker.tsx` compares `option.name` only. The list shows `displayName` (`RoleMenuOption.tsx`). `Role` comes from `app/types/accessControl`.

```text
You are a Cursor cloud agent on the halricci/grafana fork. Read Jira HD-3 (https://fe-anysphere-demo.atlassian.net/browse/HD-3). Do not transition, comment on, or edit the Jira issue.

Goal: role picker search matches the display name as well as the internal name, case-insensitively. Searching by the internal name must still work. Remove the TODO on the filter.

Area: public/app/core/components/RolePicker/RolePicker.tsx, getOptions, around the filter on option.name. Add public/app/core/components/RolePicker/RolePicker.test.tsx. There is no test in that folder today. Do not edit RolePickerDrawer.

Branch from main. Never commit or push to main. Open a pull request against main with HD-3 in the body.

Verify: yarn jest --no-watch public/app/core/components/RolePicker/RolePicker.test.tsx
Cover three cases: a display-name substring matches, the internal name still matches, and a role with no displayName still matches on name. Matching is case-insensitive. yarn test watches forever in this repo. Use yarn jest --no-watch.
```

## HD-4

This is the ticket that can take longer than a few minutes. The night region is an `ol-ext` `DayNight` source (`source.setTime`), not a single vector feature. A "Both" option needs a second night layer with its own source and a lighter fill, and the existing tests assert the layer counts for the default config (2 layers, or 4 when the sun is on). Default stays `ShowTime.To`, so saved panels keep one night region.

```text
You are a Cursor cloud agent on the halricci/grafana fork. Read Jira HD-4 (https://fe-anysphere-demo.atlassian.net/browse/HD-4). Do not transition, comment on, or edit the Jira issue.

Goal: add a "Both" choice to the Geomap Night / Day layer. It draws the night region at the start and at the end of the dashboard time range. The two regions must be visually distinct. From and To stay as they are. Saved panels that do not pick Both render exactly as before.

Area: public/app/plugins/panel/geomap/layers/data/dayNightLayer.tsx. ShowTime is From | To. registerOptionsUI builds the Show radio. update() calls source.setTime with one Date. The TODO on update() is the spot. The night polygon is a DayNight source on a VectorImage, not one feature. Add a second DayNight source for the range start when show is Both, with a lighter fill. Extend dayNightLayer.test.ts. Default config and the existing layer-count tests must stay green.

Branch from main. Never commit or push to main. Open a pull request against main with HD-4 in the body. Stay inside dayNightLayer.tsx and dayNightLayer.test.ts.

Verify: yarn jest --no-watch public/app/plugins/panel/geomap/layers/data/dayNightLayer.test.ts
yarn test watches forever in this repo. Use yarn jest --no-watch.
```

## HD-8

Easy, with one trap. `isHeatmapApplicable` returns `NotPossible` when it finds a time field or a numeric field (`if (xField || yField)`), so a normal time series is marked unavailable and the `Applicable` branch is unreachable. The ticket says "NotApplicable". This file uses `TransformationApplicabilityLevels.NotPossible` for the negative cases. Keep `NotPossible` for empty frames, frames with no time field, and time frames with no numeric field. Return `Applicable` for time plus numeric.

`applicability.test.ts` already exists. Its cases for time-plus-numeric currently expect `NotPossible` and a comment records the inversion. Update those cases. Do not add a second test file that contradicts them.

```text
You are a Cursor cloud agent on the halricci/grafana fork. Read Jira HD-8 (https://fe-anysphere-demo.atlassian.net/browse/HD-8). Do not transition, comment on, or edit the Jira issue.

Goal: the Create heatmap transformation is applicable for an ordinary time series (a time field plus a numeric field) and unavailable when it cannot use the frames.

Area: public/app/features/transformers/calculateHeatmap/applicability.ts, isHeatmapApplicable. The picker wires that function in public/app/features/transformers/standardTransformers.tsx. Do not edit standardTransformers.tsx. The same inverted if (xField || yField) block is copied on getHeatmapTransformer in heatmap.ts. Update that copy too so the two functions agree.

The negative level in this file is TransformationApplicabilityLevels.NotPossible, not NotApplicable. Keep NotPossible for empty input, no time field, and time with no numeric field. Return Applicable when a frame has a time field and a numeric field.

applicability.test.ts already exists and currently expects NotPossible for valid time series. Update those expectations. Do not add another test file.

Branch from main. Never commit or push to main. Open a pull request against main with HD-8 in the body.

Verify: yarn jest --no-watch public/app/features/transformers/calculateHeatmap/applicability.test.ts
yarn test watches forever in this repo. Use yarn jest --no-watch.
```
