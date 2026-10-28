import { createContext, useCallback, useEffect, useState } from 'react';

import { type TimeOption, type TimeRange, isDateTime, rangeUtil, store } from '@grafana/data';

// Browser-local on purpose. These must not be written onto the dashboard time picker,
// because that field is saved with the dashboard.
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.user.timepicker.quickRanges';

const MAX_PERSONAL_QUICK_RANGES = 10;

export interface PersonalQuickRangesContextValue {
  ranges: TimeOption[];
  quickRangesFromDashboard: boolean;
  save: (range: TimeRange) => void;
  remove: (option: TimeOption) => void;
}

export const PersonalQuickRangesContext = createContext<PersonalQuickRangesContextValue | null>(null);

export function parsePersonalQuickRanges(value: unknown): TimeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ranges: TimeOption[] = [];
  for (const item of value) {
    if (!isStoredQuickRange(item)) {
      continue;
    }
    ranges.push({ from: item.from, to: item.to, display: item.display });
  }

  return ranges.slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function toPersonalQuickRange(range: TimeRange): TimeOption | null {
  const from = rawEndpointToString(range.raw.from);
  const to = rawEndpointToString(range.raw.to);
  if (!from || !to) {
    return null;
  }

  const display = rangeUtil.describeTimeRange({ from, to });
  if (!display) {
    return null;
  }

  return { from, to, display };
}

export function parseQuickRangeInput(from: string, to: string, display?: string): TimeOption | null {
  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();
  if (!trimmedFrom || !trimmedTo) {
    return null;
  }

  const parsed = rangeUtil.convertRawToRange({ from: trimmedFrom, to: trimmedTo });
  if (!parsed.from.isValid() || !parsed.to.isValid()) {
    return null;
  }

  const name = display?.trim() || rangeUtil.describeTimeRange({ from: trimmedFrom, to: trimmedTo });
  if (!name) {
    return null;
  }

  return { from: trimmedFrom, to: trimmedTo, display: name };
}

export function addPersonalQuickRange(current: TimeOption[], next: TimeOption): TimeOption[] {
  const withoutDuplicate = current.filter((item) => item.from !== next.from || item.to !== next.to);
  return [next, ...withoutDuplicate].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function removePersonalQuickRange(current: TimeOption[], target: Pick<TimeOption, 'from' | 'to'>): TimeOption[] {
  return current.filter((item) => item.from !== target.from || item.to !== target.to);
}

export function readPersonalQuickRanges(): TimeOption[] {
  return parsePersonalQuickRanges(store.getObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, []));
}

export function writePersonalQuickRanges(ranges: TimeOption[]): void {
  try {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, ranges);
  } catch (error) {
    console.error(error);
  }
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(() => {
    return store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
      setRanges(readPersonalQuickRanges());
    });
  }, []);

  const remember = useCallback((option: TimeOption) => {
    writePersonalQuickRanges(addPersonalQuickRange(readPersonalQuickRanges(), option));
  }, []);

  const remove = useCallback((option: Pick<TimeOption, 'from' | 'to'>) => {
    writePersonalQuickRanges(removePersonalQuickRange(readPersonalQuickRanges(), option));
  }, []);

  const saveTimeRange = useCallback(
    (range: TimeRange) => {
      const option = toPersonalQuickRange(range);
      if (option) {
        remember(option);
      }
    },
    [remember]
  );

  return { ranges, remember, remove, saveTimeRange };
}

function isStoredQuickRange(value: unknown): value is TimeOption {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('from' in value) || !('to' in value) || !('display' in value)) {
    return false;
  }

  const { from, to, display } = value;
  return (
    typeof from === 'string' &&
    from.length > 0 &&
    typeof to === 'string' &&
    to.length > 0 &&
    typeof display === 'string' &&
    display.length > 0
  );
}

function rawEndpointToString(value: TimeRange['raw']['from']): string {
  if (typeof value === 'string') {
    return value;
  }

  if (isDateTime(value) && value.isValid()) {
    return value.toISOString();
  }

  return '';
}
