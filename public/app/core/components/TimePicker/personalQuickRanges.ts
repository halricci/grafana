import { useCallback, useEffect, useState } from 'react';

import { dateMath, rangeUtil, store, type RawTimeRange, type TimeOption } from '@grafana/data';

export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personal-quick-ranges';

const MAX_PERSONAL_QUICK_RANGES = 20;
const MAX_DISPLAY_LENGTH = 80;

export function readPersonalQuickRanges(): TimeOption[] {
  return parsePersonalQuickRanges(store.getObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, []));
}

export function parsePersonalQuickRanges(value: unknown): TimeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ranges: TimeOption[] = [];
  for (const item of value) {
    const parsed = parseStoredQuickRange(item);
    if (parsed) {
      ranges.push(parsed);
    }
  }

  return ranges.slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function createPersonalQuickRange(fromInput: string, toInput: string, displayInput: string): TimeOption | null {
  const fromTrimmed = fromInput.trim();
  const toTrimmed = toInput.trim();
  const display = displayInput.trim();

  let from = fromTrimmed;
  let to = toTrimmed || 'now';

  // A bare duration in From ("45m") means the same thing as the time picker's quick-range search.
  if (from && !from.startsWith('now') && to === 'now') {
    if (!rangeUtil.isValidTimeSpan(from)) {
      return null;
    }
    const described = rangeUtil.describeTextRange(from);
    if (described.invalid || described.to !== 'now') {
      return null;
    }
    from = described.from;
    to = described.to;
  }

  return quickRangeFromRaw({ from, to }, display || undefined);
}

export function quickRangeFromRaw(raw: RawTimeRange, display?: string): TimeOption | null {
  if (typeof raw.from !== 'string' || typeof raw.to !== 'string') {
    return null;
  }

  const from = raw.from.trim();
  const to = raw.to.trim();
  // Absolute ranges belong in recently used history, not in quick ranges.
  if (!from.startsWith('now') || !to.startsWith('now')) {
    return null;
  }
  if (!dateMath.parse(from, false)?.isValid() || !dateMath.parse(to, true)?.isValid()) {
    return null;
  }

  const name = (display ?? rangeUtil.describeTimeRange({ from, to })).trim();
  if (!name) {
    return null;
  }

  return { from, to, display: name.slice(0, MAX_DISPLAY_LENGTH) };
}

export function addPersonalQuickRange(existing: TimeOption[], next: TimeOption): TimeOption[] {
  const created = quickRangeFromRaw(next, next.display);
  if (!created) {
    return existing;
  }

  const without = existing.filter((item) => item.from !== created.from || item.to !== created.to);
  return [created, ...without].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function removePersonalQuickRange(
  existing: TimeOption[],
  target: Pick<TimeOption, 'from' | 'to'>
): TimeOption[] {
  return existing.filter((item) => item.from !== target.from || item.to !== target.to);
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(() => store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => setRanges(readPersonalQuickRanges())), []);

  const save = useCallback((option: TimeOption) => {
    const current = readPersonalQuickRanges();
    const next = addPersonalQuickRange(current, option);
    if (next === current) {
      return;
    }
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, next);
  }, []);

  const remove = useCallback((option: TimeOption) => {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, removePersonalQuickRange(readPersonalQuickRanges(), option));
  }, []);

  return { ranges, save, remove };
}

function parseStoredQuickRange(value: unknown): TimeOption | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  if (!('from' in value) || !('to' in value) || !('display' in value)) {
    return null;
  }

  const { from, to, display } = value;
  if (typeof from !== 'string' || typeof to !== 'string' || typeof display !== 'string') {
    return null;
  }

  return quickRangeFromRaw({ from, to }, display);
}
