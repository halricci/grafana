import { createContext, useContext } from 'react';

import { type TimeOption } from '@grafana/data';
import { t } from '@grafana/i18n';

export type PersonalRangeSaveState = 'ready' | 'saved' | 'invalid';

export interface TimePickerPersonalRangesValue {
  ranges: TimeOption[];
  dashboardLabel: string;
  saveState: PersonalRangeSaveState;
  onSave: () => void;
  onRemove: (option: TimeOption) => void;
}

export const TimePickerPersonalRangesContext = createContext<TimePickerPersonalRangesValue | null>(null);

const NO_RANGES: TimeOption[] = [];

export interface PersonalRangeProps {
  personalRanges?: TimeOption[];
  dashboardRangesLabel?: string;
  personalRangeSaveState?: PersonalRangeSaveState;
  onSavePersonalRange?: () => void;
  onRemovePersonalRange?: (option: TimeOption) => void;
}

export interface ResolvedPersonalRanges {
  enabled: boolean;
  ranges: TimeOption[];
  dashboardLabel: string;
  saveState: PersonalRangeSaveState;
  onSave?: () => void;
  onRemove?: (option: TimeOption) => void;
}

export function useResolvedPersonalRanges(props: PersonalRangeProps): ResolvedPersonalRanges {
  const fromContext = useContext(TimePickerPersonalRangesContext);
  const ranges = props.personalRanges !== undefined ? props.personalRanges : fromContext?.ranges;

  return {
    enabled: ranges !== undefined,
    ranges: ranges ?? NO_RANGES,
    dashboardLabel:
      props.dashboardRangesLabel ??
      fromContext?.dashboardLabel ??
      t('time-picker.content.dashboard-ranges', 'Dashboard'),
    saveState: props.personalRangeSaveState ?? fromContext?.saveState ?? 'ready',
    onSave: props.onSavePersonalRange ?? fromContext?.onSave,
    onRemove: props.onRemovePersonalRange ?? fromContext?.onRemove,
  };
}
