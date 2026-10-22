import { useCallback, useEffect, useState } from 'react';

import { dateMath, isDateTime, rangeUtil, store, type TimeOption, type TimeRange, type TimeZone } from '@grafana/data';

import { isValid } from '../utils';

export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';
export const MAX_PERSONAL_QUICK_RANGES = 20;

export type PersonalQuickRangeError = 'empty' | 'invalid' | 'order';

export type PersonalQuickRangeResult = { ok: true; range: TimeOption } | { ok: false; error: PersonalQuickRangeError };

export function readPersonalQuickRanges(): TimeOption[] {
  const raw = store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY);
  if (typeof raw !== 'string' || raw.length === 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const ranges: TimeOption[] = [];
    for (const item of parsed) {
      const valid = parseStoredRange(item);
      if (valid) {
        ranges.push(valid);
      }
    }
    return ranges.slice(0, MAX_PERSONAL_QUICK_RANGES);
  } catch {
    return [];
  }
}

export function writePersonalQuickRanges(ranges: TimeOption[]) {
  store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, ranges.slice(0, MAX_PERSONAL_QUICK_RANGES).map(toStoredRange));
}

export function upsertPersonalQuickRange(range: TimeOption, existing: TimeOption[]): TimeOption[] {
  const next = toStoredRange(range);
  const without = existing.filter((item) => item.from !== next.from || item.to !== next.to);
  return [next, ...without].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function removePersonalQuickRange(range: Pick<TimeOption, 'from' | 'to'>, existing: TimeOption[]): TimeOption[] {
  return existing.filter((item) => item.from !== range.from || item.to !== range.to);
}

export function createPersonalQuickRange(from: string, to: string, timeZone?: TimeZone): PersonalQuickRangeResult {
  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();

  if (!trimmedFrom || !trimmedTo) {
    return { ok: false, error: 'empty' };
  }

  if (!isValid(trimmedFrom, false, timeZone) || !isValid(trimmedTo, true, timeZone)) {
    return { ok: false, error: 'invalid' };
  }

  const raw = { from: trimmedFrom, to: trimmedTo };
  const converted = rangeUtil.convertRawToRange(raw, timeZone);
  if (!converted.from.isValid() || !converted.to.isValid() || converted.from.isAfter(converted.to)) {
    return { ok: false, error: 'order' };
  }

  return {
    ok: true,
    range: {
      from: trimmedFrom,
      to: trimmedTo,
      display: rangeUtil.describeTimeRange(raw, timeZone),
    },
  };
}

export function optionFromTimeRange(value: TimeRange, timeZone?: TimeZone, quickRanges?: TimeOption[]): TimeOption {
  const from = endpointToString(value.raw.from);
  const to = endpointToString(value.raw.to);
  const described = {
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : value.from,
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : value.to,
  };

  return {
    from,
    to,
    display: rangeUtil.describeTimeRange(described, timeZone, quickRanges),
  };
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState<TimeOption[]>(() => readPersonalQuickRanges());

  useEffect(
    () =>
      store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
        setRanges(readPersonalQuickRanges());
      }),
    []
  );

  const save = useCallback((option: TimeOption) => {
    const next = upsertPersonalQuickRange(option, readPersonalQuickRanges());
    writePersonalQuickRanges(next);
    setRanges(next);
  }, []);

  const remove = useCallback((option: Pick<TimeOption, 'from' | 'to'>) => {
    const next = removePersonalQuickRange(option, readPersonalQuickRanges());
    writePersonalQuickRanges(next);
    setRanges(next);
  }, []);

  return { ranges, save, remove };
}

function parseStoredRange(value: unknown): TimeOption | null {
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

  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();
  const trimmedDisplay = display.trim();
  if (!trimmedFrom || !trimmedTo || !trimmedDisplay) {
    return null;
  }

  return { from: trimmedFrom, to: trimmedTo, display: trimmedDisplay };
}

function toStoredRange(range: TimeOption): TimeOption {
  return {
    display: range.display.trim(),
    from: range.from.trim(),
    to: range.to.trim(),
  };
}

function endpointToString(value: TimeRange['raw']['from']): string {
  if (typeof value === 'string') {
    return value;
  }

  if (isDateTime(value)) {
    return value.toISOString();
  }

  return String(value);
}
