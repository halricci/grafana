import { uniqBy } from 'lodash';
import { useLocalStorage } from 'react-use';

import { type TimeRange, intervalToAbbreviatedDurationString, isDateTime, rangeUtil } from '@grafana/data';
import { t } from '@grafana/i18n';
import { type SceneComponentProps, type SceneTimePicker, sceneGraph } from '@grafana/scenes';
import { TimeRangePicker } from '@grafana/ui';

import { usePersonalQuickRanges } from '../settings/personalQuickRanges';

const HISTORY_LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const MAX_HISTORY_ITEMS = 4;

export function DashboardTimePicker({ model }: SceneComponentProps<SceneTimePicker>) {
  const { hidePicker, isOnCanvas, quickRanges, defaultQuickRanges, hideTimeSettings } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const timeRangeState = timeRange.useState();
  const timeZone = timeRange.getTimeZone();
  const { ranges: personalRanges, addRange, removeRange } = usePersonalQuickRanges();
  const [timeRangeHistory, setTimeRangeHistory] = useLocalStorage<TimeRange[]>(HISTORY_LOCAL_STORAGE_KEY, [], {
    raw: false,
    serializer: serializeHistory,
    deserializer: deserializeHistory,
  });

  if (hidePicker) {
    return null;
  }

  const rangesToUse = quickRanges || defaultQuickRanges;
  const halfSpanMs = (timeRangeState.value.to.valueOf() - timeRangeState.value.from.valueOf()) / 2;
  const moveDuration = intervalToAbbreviatedDurationString({
    start: new Date(timeRangeState.value.from.valueOf()),
    end: new Date(timeRangeState.value.from.valueOf() + halfSpanMs),
  });
  const canMoveForward = timeRangeState.value.to.valueOf() + halfSpanMs <= Date.now();

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
        canMoveForward
          ? t('dashboard.time-picker.move-forward-tooltip', 'Move {{moveDuration}} forward', { moveDuration })
          : undefined
      }
      moveBackwardTooltip={t('dashboard.time-picker.move-backward-tooltip', 'Move {{moveDuration}} backward', {
        moveDuration,
      })}
      hideTimeZone={hideTimeSettings}
      onZoom={model.onZoom}
      onChangeTimeZone={timeRange.onTimeZoneChange}
      onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
      weekStart={timeRangeState.weekStart}
      history={timeRangeHistory}
      quickRanges={rangesToUse}
      quickRangesTitle={
        quickRanges
          ? t('dashboard.time-picker.dashboard-ranges-title', 'Dashboard ranges')
          : t('dashboard.time-picker.quick-ranges-title', 'Quick ranges')
      }
      personalRanges={personalRanges}
      onSavePersonalRange={addRange}
      onRemovePersonalRange={removeRange}
    />
  );
}

function deserializeHistory(value: string): TimeRange[] {
  const values: Array<{ from: string; to: string }> = JSON.parse(value);
  return values.map((item) => rangeUtil.convertRawToRange(item, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss'));
}

function serializeHistory(values: TimeRange[]): string {
  return JSON.stringify(
    limitHistory(
      values.map((value) => ({
        from: typeof value.raw.from === 'string' ? value.raw.from : value.raw.from.toISOString(),
        to: typeof value.raw.to === 'string' ? value.raw.to : value.raw.to.toISOString(),
      }))
    )
  );
}

function limitHistory(values: Array<{ from: string; to: string }>) {
  return uniqBy(values, (value) => value.from + value.to).slice(0, MAX_HISTORY_ITEMS);
}

function isAbsolute(value: TimeRange): boolean {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}
