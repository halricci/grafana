import { useCallback, useSyncExternalStore } from 'react';

import { store, type TimeOption } from '@grafana/data';

export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.quickRanges';
const MAX_PERSONAL_QUICK_RANGES = 10;

export function getPersonalQuickRanges(): TimeOption[] {
  try {
    return parsePersonalQuickRanges(store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function savePersonalQuickRanges(ranges: TimeOption[]): void {
  store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, normalizeRanges(ranges));
}

export function addPersonalQuickRange(range: TimeOption): void {
  savePersonalQuickRanges([range, ...getPersonalQuickRanges()]);
}

export function removePersonalQuickRange(range: TimeOption): void {
  savePersonalQuickRanges(getPersonalQuickRanges().filter((item) => item.from !== range.from || item.to !== range.to));
}

export function usePersonalQuickRanges() {
  const ranges = useSyncExternalStore(
    (onStoreChange) => store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, onStoreChange),
    getSnapshot,
    () => '[]'
  );

  return {
    ranges: parsePersonalQuickRanges(ranges),
    addRange: useCallback(addPersonalQuickRange, []),
    removeRange: useCallback(removePersonalQuickRange, []),
  };
}

function getSnapshot() {
  return store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]';
}

function parsePersonalQuickRanges(value: string | null): TimeOption[] {
  if (value === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? normalizeRanges(parsed) : [];
  } catch {
    return [];
  }
}

function normalizeRanges(ranges: unknown[]): TimeOption[] {
  const result: TimeOption[] = [];
  const seen = new Set<string>();

  for (const range of ranges) {
    if (!isTimeOption(range)) {
      continue;
    }

    const key = `${range.from}\0${range.to}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(range);

    if (result.length === MAX_PERSONAL_QUICK_RANGES) {
      break;
    }
  }

  return result;
}

function isTimeOption(value: unknown): value is TimeOption {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length !== 3 || !keys.includes('from') || !keys.includes('to') || !keys.includes('display')) {
    return false;
  }

  if (!('from' in value) || !('to' in value) || !('display' in value)) {
    return false;
  }

  return (
    typeof value.from === 'string' &&
    value.from.length > 0 &&
    typeof value.to === 'string' &&
    value.to.length > 0 &&
    typeof value.display === 'string' &&
    value.display.length > 0
  );
}
