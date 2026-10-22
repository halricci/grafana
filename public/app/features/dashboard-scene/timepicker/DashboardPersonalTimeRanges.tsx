import { useSyncExternalStore, type ReactNode } from 'react';

import { type TimeOption } from '@grafana/data';
import { t } from '@grafana/i18n';
import { sceneGraph, type SceneTimePicker } from '@grafana/scenes';
import { TimePickerPersonalRangesContext } from '@grafana/ui';

import {
  addPersonalTimeRange,
  getPersonalRangeSaveState,
  getPersonalTimeRangesSnapshot,
  removePersonalTimeRange,
  subscribePersonalTimeRanges,
} from './personalTimeRanges';

interface Props {
  timePicker: SceneTimePicker;
  children: ReactNode;
}

export function DashboardPersonalTimeRanges({ timePicker, children }: Props) {
  const ranges = useSyncExternalStore(
    subscribePersonalTimeRanges,
    getPersonalTimeRangesSnapshot,
    getPersonalTimeRangesSnapshot
  );
  const timeRange = sceneGraph.getTimeRange(timePicker);
  const timeRangeState = timeRange.useState();
  const { quickRanges, defaultQuickRanges } = timePicker.useState();
  const timeZone = timeRange.getTimeZone();
  const namingRanges = quickRanges ?? defaultQuickRanges;
  const raw = timeRangeState.value?.raw;
  const saveState = getPersonalRangeSaveState(raw, { timeZone, quickRanges: namingRanges });
  const dashboardLabel = quickRanges
    ? t('dashboard.timepicker.personal-ranges.dashboard-label', 'Dashboard')
    : t('dashboard.timepicker.personal-ranges.quick-label', 'Quick ranges');

  return (
    <TimePickerPersonalRangesContext.Provider
      value={{
        ranges,
        dashboardLabel,
        saveState,
        onSave: () => {
          if (raw) {
            addPersonalTimeRange(raw, { timeZone, quickRanges: namingRanges });
          }
        },
        onRemove: (option: TimeOption) => {
          removePersonalTimeRange(option);
        },
      }}
    >
      {children}
    </TimePickerPersonalRangesContext.Provider>
  );
}
