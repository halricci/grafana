import { useCallback, useEffect, useState } from 'react';

import { type DateTime, type TimeOption, type TimeRange, store } from '@grafana/data';

/**
 * Personal quick ranges live in the browser, not on the dashboard model.
 * Saving or removing one must not mark the dashboard dirty or change its JSON.
 */
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';

/** A long list makes the picker hard to scan, so new ranges push the oldest off the end. */
export const MAX_PERSONAL_QUICK_RANGES = 20;

export function readPersonalQuickRanges(): TimeOption[] {
  const stored = store.getObject<unknown>(PERSONAL_QUICK_RANGES_STORAGE_KEY, []);
  if (!Array.isArray(stored)) {
    return [];
  }

  const ranges: TimeOption[] = [];
  for (const item of stored) {
    const normalized = normalizeStoredRange(item);
    if (normalized) {
      ranges.push(normalized);
    }
  }
  return ranges;
}

export function writePersonalQuickRanges(ranges: TimeOption[]): void {
  const stored = ranges.slice(0, MAX_PERSONAL_QUICK_RANGES).flatMap((range) => {
    const normalized = normalizeStoredRange(range);
    return normalized ? [normalized] : [];
  });

  try {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, stored);
  } catch (error) {
    console.error(error);
  }
}

export function withPersonalQuickRange(ranges: TimeOption[], range: TimeOption): TimeOption[] {
  const normalized = normalizeStoredRange(range);
  if (!normalized) {
    return ranges;
  }

  const rest = ranges.filter((item) => item.from !== normalized.from || item.to !== normalized.to);
  return [normalized, ...rest].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function withoutPersonalQuickRange(ranges: TimeOption[], range: Pick<TimeOption, 'from' | 'to'>): TimeOption[] {
  return ranges.filter((item) => item.from !== range.from || item.to !== range.to);
}

export function timeRangeToPersonalQuickRange(range: TimeRange, display: string): TimeOption | null {
  const from = endpointToString(range.raw.from);
  const to = endpointToString(range.raw.to);
  return normalizeStoredRange({ display, from, to });
}

export function usePersonalQuickRanges(enabled = true) {
  const [ranges, setRanges] = useState<TimeOption[]>(() => (enabled ? readPersonalQuickRanges() : []));

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setRanges(readPersonalQuickRanges());
    return store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
      setRanges(readPersonalQuickRanges());
    });
  }, [enabled]);

  const replace = useCallback((next: TimeOption[]) => {
    writePersonalQuickRanges(next);
  }, []);

  return { ranges, replace };
}

function normalizeStoredRange(value: unknown): TimeOption | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (!('display' in value) || !('from' in value) || !('to' in value)) {
    return null;
  }

  const { display, from, to } = value;
  if (typeof display !== 'string' || typeof from !== 'string' || typeof to !== 'string') {
    return null;
  }

  const trimmedDisplay = display.trim();
  const trimmedFrom = from.trim();
  const trimmedTo = to.trim();
  if (!trimmedDisplay || !trimmedFrom || !trimmedTo) {
    return null;
  }

  return { display: trimmedDisplay, from: trimmedFrom, to: trimmedTo };
}

function endpointToString(value: string | DateTime): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value?.toISOString?.() ?? '';
}
