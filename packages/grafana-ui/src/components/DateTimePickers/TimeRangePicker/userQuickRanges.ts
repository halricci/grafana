import { useCallback, useEffect, useState } from 'react';

import { dateMath, dateTime, rangeUtil, store, type TimeOption, type TimeRange } from '@grafana/data';

// Browser-local on purpose: these belong to the user, not the dashboard JSON.
export const PERSONAL_QUICK_RANGES_KEY = 'grafana.user.timepicker.quickRanges';

const MAX_PERSONAL_QUICK_RANGES = 20;

export interface StoredQuickRange {
  from: string;
  to: string;
  display: string;
}

export type QuickRangeInputError = 'name' | 'from' | 'to';

export function readPersonalQuickRanges(): StoredQuickRange[] {
  return parsePersonalQuickRanges(store.getObject(PERSONAL_QUICK_RANGES_KEY, []));
}

export function writePersonalQuickRanges(ranges: StoredQuickRange[]): void {
  store.setObject(PERSONAL_QUICK_RANGES_KEY, ranges);
}

export function parsePersonalQuickRanges(value: unknown): StoredQuickRange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ranges: StoredQuickRange[] = [];
  for (const item of value) {
    const parsed = parseStoredQuickRange(item);
    if (parsed) {
      ranges.push(parsed);
    }
  }
  return ranges;
}

export function toTimeOptions(ranges: StoredQuickRange[]): TimeOption[] {
  return ranges.map(({ from, to, display }) => ({ from, to, display }));
}

export function withSavedRange(ranges: StoredQuickRange[], next: StoredQuickRange): StoredQuickRange[] {
  const withoutCurrent = ranges.filter((item) => item.from !== next.from || item.to !== next.to);
  return [next, ...withoutCurrent].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function withoutRange(ranges: StoredQuickRange[], target: { from: string; to: string }): StoredQuickRange[] {
  return ranges.filter((item) => item.from !== target.from || item.to !== target.to);
}

export function quickRangeInputError(display: string, from: string, to: string): QuickRangeInputError | null {
  if (!display.trim()) {
    return 'name';
  }
  if (!isQuickRangeEndpoint(from)) {
    return 'from';
  }
  if (!isQuickRangeEndpoint(to)) {
    return 'to';
  }
  return null;
}

export function normalizeQuickRange(display: string, from: string, to: string): StoredQuickRange | null {
  if (quickRangeInputError(display, from, to)) {
    return null;
  }
  return { display: display.trim(), from: from.trim(), to: to.trim() };
}

/**
 * Keeps a name the user already gave this from/to when they save again without typing one.
 */
export function storedQuickRangeFromTimeRange(
  range: TimeRange,
  name: string,
  existing: StoredQuickRange[]
): StoredQuickRange | null {
  const from = endpointToString(range.raw.from);
  const to = endpointToString(range.raw.to);
  if (!from || !to) {
    return null;
  }

  const previous = existing.find((item) => item.from === from && item.to === to);
  const display = name.trim() || previous?.display || rangeUtil.describeTimeRange(range.raw).trim();
  if (!display) {
    return null;
  }

  return { from, to, display };
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(() => store.subscribe(PERSONAL_QUICK_RANGES_KEY, () => setRanges(readPersonalQuickRanges())), []);

  const save = useCallback((range: StoredQuickRange) => {
    writePersonalQuickRanges(withSavedRange(readPersonalQuickRanges(), range));
  }, []);

  const remove = useCallback((target: { from: string; to: string }) => {
    writePersonalQuickRanges(withoutRange(readPersonalQuickRanges(), target));
  }, []);

  return { ranges, save, remove };
}

function parseStoredQuickRange(value: unknown): StoredQuickRange | null {
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

  const name = display.trim();
  if (!from || !to || !name) {
    return null;
  }

  return { from, to, display: name };
}

function isQuickRangeEndpoint(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed === 'now' || trimmed.startsWith('now')) {
    return Boolean(dateMath.parse(trimmed, false)?.isValid());
  }
  // dateTime() warns when moment falls back to the JS Date parser, so only try real dates.
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return false;
  }
  return dateTime(trimmed).isValid();
}

function endpointToString(value: TimeRange['raw']['from']): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value?.toISOString) {
    return value.toISOString();
  }
  return '';
}
