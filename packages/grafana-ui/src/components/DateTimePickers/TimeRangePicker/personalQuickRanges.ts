import { useCallback, useEffect, useState } from 'react';

import { dateMath, isValidGrafanaDuration, rangeUtil, store, type TimeOption } from '@grafana/data';

// Personal quick ranges live in the browser, not on the dashboard. A viewer can
// keep them across dashboards without edit permission, and removing one must
// leave the dashboard JSON and the recently-used history untouched.
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';

export const MAX_PERSONAL_QUICK_RANGES = 15;

const MAX_DISPLAY_LENGTH = 80;
const MAX_EXPR_LENGTH = 64;

export type SavePersonalQuickRangeResult =
  | { ok: true; ranges: TimeOption[] }
  | { ok: false; reason: 'invalid' | 'duplicate' | 'limit' };

export function readPersonalQuickRanges(): TimeOption[] {
  const stored = store.getObject<unknown>(PERSONAL_QUICK_RANGES_STORAGE_KEY, []);
  if (!Array.isArray(stored)) {
    return [];
  }

  const ranges: TimeOption[] = [];
  for (const item of stored) {
    const parsed = parsePersonalQuickRange(item);
    if (parsed) {
      ranges.push(parsed);
    }
  }

  return ranges.slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function parsePersonalQuickRange(value: unknown): TimeOption | null {
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

  const range = { from: from.trim(), to: to.trim(), display: display.trim() };
  if (
    !range.display ||
    range.display.length > MAX_DISPLAY_LENGTH ||
    range.from.length > MAX_EXPR_LENGTH ||
    range.to.length > MAX_EXPR_LENGTH ||
    !isRelativeQuickRange(range.from) ||
    !isRelativeQuickRange(range.to)
  ) {
    return null;
  }

  return range;
}

export function normalizeQuickRange(from: string, to: string, display?: string): TimeOption | null {
  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();
  if (!trimmedFrom || !trimmedTo) {
    return null;
  }

  const named = display?.trim();

  // The time picker search box accepts a bare duration such as "6h".
  if (!trimmedFrom.includes('now') && trimmedTo === 'now' && isValidGrafanaDuration(trimmedFrom)) {
    const described = rangeUtil.describeTextRange(trimmedFrom);
    if (described.invalid || !described.display) {
      return null;
    }
    return parsePersonalQuickRange({
      from: described.from,
      to: described.to,
      display: named || described.display,
    });
  }

  const fallback = rangeUtil.describeTimeRange({ from: trimmedFrom, to: trimmedTo });
  return parsePersonalQuickRange({
    from: trimmedFrom,
    to: trimmedTo,
    display: named || fallback,
  });
}

export function addPersonalQuickRange(ranges: TimeOption[], next: TimeOption): SavePersonalQuickRangeResult {
  const parsed = parsePersonalQuickRange(next);
  if (!parsed) {
    return { ok: false, reason: 'invalid' };
  }

  if (ranges.some((range) => range.from === parsed.from && range.to === parsed.to)) {
    return { ok: false, reason: 'duplicate' };
  }

  if (ranges.length >= MAX_PERSONAL_QUICK_RANGES) {
    return { ok: false, reason: 'limit' };
  }

  return { ok: true, ranges: [parsed, ...ranges] };
}

export function removePersonalQuickRange(ranges: TimeOption[], target: Pick<TimeOption, 'from' | 'to'>): TimeOption[] {
  return ranges.filter((range) => range.from !== target.from || range.to !== target.to);
}

export function writePersonalQuickRanges(ranges: TimeOption[]) {
  store.setObject(
    PERSONAL_QUICK_RANGES_STORAGE_KEY,
    ranges.map((range) => ({ from: range.from, to: range.to, display: range.display }))
  );
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(() => {
    return store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
      setRanges(readPersonalQuickRanges());
    });
  }, []);

  const save = useCallback((option: TimeOption): SavePersonalQuickRangeResult => {
    const result = addPersonalQuickRange(readPersonalQuickRanges(), option);
    if (result.ok) {
      writePersonalQuickRanges(result.ranges);
      setRanges(result.ranges);
    }
    return result;
  }, []);

  const remove = useCallback((option: Pick<TimeOption, 'from' | 'to'>) => {
    const next = removePersonalQuickRange(readPersonalQuickRanges(), option);
    writePersonalQuickRanges(next);
    setRanges(next);
  }, []);

  return { ranges, save, remove };
}

function isRelativeQuickRange(value: string): boolean {
  return value.includes('now') && dateMath.parse(value) !== undefined;
}
