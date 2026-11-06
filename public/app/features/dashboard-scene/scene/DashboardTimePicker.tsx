import { uniqBy } from 'lodash';
import { useLocalStorage } from 'react-use';

import { intervalToAbbreviatedDurationString, isDateTime, rangeUtil, type TimeRange } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { sceneGraph, type SceneTimePicker, type SceneComponentProps } from '@grafana/scenes';
import { TimeRangePicker } from '@grafana/ui';
import { usePersonalQuickRanges } from 'app/core/components/TimePicker/personalQuickRanges';

// Same key SceneTimePicker writes, so recently used absolute ranges stay the list they were.
const HISTORY_LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const MAX_HISTORY_ITEMS = 4;

interface TimePickerHistoryItem {
  from: string;
  to: string;
}

// SceneTimePicker folds dashboard quick ranges and the built-in defaults into one list, so the
// picker cannot label them. This renderer keeps the dashboard list separate and passes personal
// ranges from browser storage, which is not part of the dashboard save model.
export function DashboardTimePicker({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas, quickRanges, defaultQuickRanges, hideTimeSettings } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeZone = timeRange.getTimeZone();
  const timeRangeState = timeRange.useState();
  const {
    ranges: personalQuickRanges,
    add: addPersonalQuickRange,
    remove: removePersonalQuickRange,
  } = usePersonalQuickRanges();
  const [timeRangeHistory, setTimeRangeHistory] = useLocalStorage<TimeRange[]>(HISTORY_LOCAL_STORAGE_KEY, [], {
    raw: false,
    serializer: serializeHistory,
    deserializer: deserializeHistory,
  });

  if (hidePicker) {
    return null;
  }

  const dashboardQuickRanges = quickRanges && quickRanges.length > 0 ? quickRanges : undefined;
  // An explicit empty dashboard list still replaces the defaults, matching SceneTimePicker.
  const rangesToUse = quickRanges !== undefined ? quickRanges : defaultQuickRanges;
  const halfSpanMs = (timeRangeState.value.to.valueOf() - timeRangeState.value.from.valueOf()) / 2;
  const moveBackwardDuration = intervalToAbbreviatedDurationString({
    start: new Date(timeRangeState.value.from.valueOf()),
    end: new Date(timeRangeState.value.from.valueOf() + halfSpanMs),
  });
  const canMoveForward = timeRangeState.value.to.valueOf() + halfSpanMs <= Date.now();
  const moveForwardDuration = canMoveForward ? moveBackwardDuration : undefined;

  return (
    <TimeRangePicker
      isOnCanvas={isOnCanvas ?? true}
      value={timeRangeState.value}
      onChange={(range) => {
        if (isAbsolute(range)) {
          setTimeRangeHistory([range, ...(timeRangeHistory ?? [])]);
        }
        timeRange.onTimeRangeChange(range);
      }}
      timeZone={timeZone}
      fiscalYearStartMonth={timeRangeState.fiscalYearStartMonth}
      onMoveBackward={model.onMoveBackward}
      onMoveForward={model.onMoveForward}
      moveForwardTooltip={
        moveForwardDuration
          ? t('grafana-scenes.components.time-picker.move-forward-tooltip', 'Move {{moveForwardDuration}} forward', {
              moveForwardDuration,
            })
          : undefined
      }
      moveBackwardTooltip={t(
        'grafana-scenes.components.time-picker.move-backward-tooltip',
        'Move {{moveBackwardDuration}} backward',
        { moveBackwardDuration }
      )}
      hideTimeZone={hideTimeSettings}
      onZoom={model.onZoom}
      onChangeTimeZone={timeRange.onTimeZoneChange}
      onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
      weekStart={timeRangeState.weekStart}
      history={timeRangeHistory ?? []}
      quickRanges={rangesToUse}
      quickRangesLabel={
        dashboardQuickRanges ? t('dashboard.time-picker.dashboard-quick-ranges', 'Dashboard quick ranges') : undefined
      }
      quickRangesTestId={dashboardQuickRanges ? selectors.components.TimePicker.dashboardQuickRanges : undefined}
      personalQuickRanges={personalQuickRanges}
      onSavePersonalQuickRange={addPersonalQuickRange}
      onRemovePersonalQuickRange={removePersonalQuickRange}
    />
  );
}

function deserializeHistory(value: string): TimeRange[] {
  const values: unknown = JSON.parse(value);
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((item: TimePickerHistoryItem) =>
    rangeUtil.convertRawToRange(item, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss')
  );
}

function serializeHistory(values: TimeRange[]): string {
  return JSON.stringify(
    uniqBy(
      values.map((range) => ({
        from: typeof range.raw.from === 'string' ? range.raw.from : range.raw.from.toISOString(),
        to: typeof range.raw.to === 'string' ? range.raw.to : range.raw.to.toISOString(),
      })),
      (range) => range.from + range.to
    ).slice(0, MAX_HISTORY_ITEMS)
  );
}

function isAbsolute(value: TimeRange): boolean {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}
