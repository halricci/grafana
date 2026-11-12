import { createContext } from 'react';

import { dateMath, rangeUtil, type TimeOption } from '@grafana/data';

/** Personal quick ranges stay in the browser. Twenty is enough to scroll; more would crowd the picker. */
export const MAX_PERSONAL_QUICK_RANGES = 20;

/**
 * Values the time picker reads so a user's ranges can sit beside dashboard ranges.
 * SceneTimePicker does not accept this list — it would be serialized onto the dashboard.
 */
export interface TimePickerQuickRangeGroups {
  personalRanges: TimeOption[];
  onPersonalQuickRangesChange: (ranges: TimeOption[]) => void;
  /** Set only when the open dashboard stores its own quick ranges. */
  dashboardRanges?: TimeOption[];
}

export const TimePickerQuickRangeGroupsContext = createContext<TimePickerQuickRangeGroups | null>(null);

/**
 * Relative date math (`now-6h`, `now-1d/d`) and the duration shorthand the picker already
 * accepts (`5m`). Absolute timestamps belong in recently used ranges, not this list.
 */
export function isRelativeTimeExpression(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (dateMath.isMathString(trimmed)) {
    return dateMath.parse(trimmed)?.isValid() === true;
  }

  return rangeUtil.describeTextRange(trimmed).invalid !== true;
}

export function rangesEqual(left?: TimeOption[], right?: TimeOption[]): boolean {
  if (!left?.length || !right?.length || left.length !== right.length) {
    return false;
  }

  return left.every((option, index) => {
    const other = right[index];
    return option.from === other.from && option.to === other.to && option.display === other.display;
  });
}
