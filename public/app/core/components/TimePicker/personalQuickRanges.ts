import { useCallback, useEffect, useState } from 'react';

import { store, type TimeOption } from '@grafana/data';

// Browser storage, not the dashboard model. A personal range has to be there the next
// time any dashboard opens, and writing it onto the dashboard would publish it to everyone.
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';

const MAX_PERSONAL_QUICK_RANGES = 20;

export interface PersonalQuickRange {
  from: string;
  to: string;
  display: string;
}

export function readPersonalQuickRanges(): PersonalQuickRange[] {
  return parsePersonalQuickRanges(store.getObject<unknown>(PERSONAL_QUICK_RANGES_STORAGE_KEY, []));
}

export function writePersonalQuickRanges(ranges: PersonalQuickRange[]): boolean {
  try {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, ranges);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function parsePersonalQuickRanges(value: unknown): PersonalQuickRange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: PersonalQuickRange[] = [];
  for (const item of value) {
    const parsed = parsePersonalQuickRange(item);
    if (parsed && !result.some((existing) => sameRange(existing, parsed))) {
      result.push(parsed);
    }
  }

  return result.slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function addPersonalQuickRange(ranges: PersonalQuickRange[], next: PersonalQuickRange): PersonalQuickRange[] {
  const parsed = parsePersonalQuickRange(next);
  if (!parsed) {
    return ranges;
  }

  return [parsed, ...ranges.filter((range) => !sameRange(range, parsed))].slice(0, MAX_PERSONAL_QUICK_RANGES);
}

export function removePersonalQuickRange(
  ranges: PersonalQuickRange[],
  target: Pick<PersonalQuickRange, 'from' | 'to'>
): PersonalQuickRange[] {
  return ranges.filter((range) => !sameRange(range, target));
}

export function sameRange(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
  return a.from === b.from && a.to === b.to;
}

export function usePersonalQuickRanges() {
  const [ranges, setRanges] = useState(readPersonalQuickRanges);

  useEffect(
    () =>
      store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
        setRanges(readPersonalQuickRanges());
      }),
    []
  );

  const add = useCallback((range: PersonalQuickRange | TimeOption) => {
    writePersonalQuickRanges(addPersonalQuickRange(readPersonalQuickRanges(), range));
  }, []);

  const remove = useCallback((range: Pick<PersonalQuickRange, 'from' | 'to'>) => {
    writePersonalQuickRanges(removePersonalQuickRange(readPersonalQuickRanges(), range));
  }, []);

  return { ranges, add, remove };
}

function parsePersonalQuickRange(value: unknown): PersonalQuickRange | null {
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

  const parsed = { from: from.trim(), to: to.trim(), display: display.trim() };
  if (!parsed.from || !parsed.to || !parsed.display) {
    return null;
  }

  return parsed;
}
