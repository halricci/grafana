import { useCallback, useEffect, useState } from 'react';

import { store, type TimeOption } from '@grafana/data';
import { isRelativeTimeExpression, MAX_PERSONAL_QUICK_RANGES } from '@grafana/ui';

/**
 * Personal quick ranges belong to the browser, not the dashboard. The key is separate from
 * recently used absolute ranges (`grafana.dashboard.timepicker.history`) so saving or removing
 * a personal range cannot change that list or the dashboard JSON.
 */
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';

const MAX_DISPLAY_LENGTH = 120;

export function readPersonalQuickRanges(): TimeOption[] {
  const raw = store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return sanitizePersonalQuickRanges(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writePersonalQuickRanges(ranges: TimeOption[]): TimeOption[] {
  const sanitized = sanitizePersonalQuickRanges(ranges);
  store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, sanitized);
  return sanitized;
}

export function sanitizePersonalQuickRanges(value: unknown): TimeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: TimeOption[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const parsed = parseStoredRange(item);
    if (!parsed) {
      continue;
    }
    const key = `${parsed.from}\u0000${parsed.to}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(parsed);
    if (result.length >= MAX_PERSONAL_QUICK_RANGES) {
      break;
    }
  }

  return result;
}

export function usePersonalQuickRanges(): readonly [TimeOption[], (ranges: TimeOption[]) => void] {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(() => store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => setRanges(readPersonalQuickRanges())), []);

  const update = useCallback((next: TimeOption[]) => {
    setRanges(writePersonalQuickRanges(next));
  }, []);

  return [ranges, update];
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
  if (!trimmedDisplay || trimmedDisplay.length > MAX_DISPLAY_LENGTH) {
    return null;
  }
  if (!isRelativeTimeExpression(trimmedFrom) || !isRelativeTimeExpression(trimmedTo)) {
    return null;
  }

  return { from: trimmedFrom, to: trimmedTo, display: trimmedDisplay };
}
