import { createContext, useSyncExternalStore } from 'react';

import { isDateTime, rangeUtil, store, type TimeOption, type TimeRange, type TimeZone } from '@grafana/data';

/**
 * Personal ranges stay in the browser. They are not part of the dashboard model,
 * so saving or removing one cannot mark the dashboard dirty or change what other people see.
 */
export const PERSONAL_QUICK_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.personalQuickRanges';

const MAX_PERSONAL_QUICK_RANGES = 20;
const EMPTY: TimeOption[] = [];

export type QuickRangesKind = 'dashboard' | 'builtin';

// SceneTimePicker folds dashboard quick ranges and server defaults into one list.
// Dashboard controls set this so the picker can label dashboard ranges on their own.
export const QuickRangesSourceContext = createContext<QuickRangesKind>('builtin');

let snapshot: TimeOption[] = EMPTY;
// undefined means the snapshot has not been read from storage yet.
let snapshotRaw: string | null | undefined;

export function timeRangeToPersonalQuickRange(value: TimeRange, timeZone?: TimeZone): TimeOption | null {
  const from = rawBoundToString(value.raw.from);
  const to = rawBoundToString(value.raw.to);
  if (!from || !to) {
    return null;
  }

  const display = rangeUtil.describeTimeRange({ from, to }, timeZone) || `${from} to ${to}`;
  return { from, to, display };
}

export function getPersonalQuickRanges(): TimeOption[] {
  const raw = readRaw();
  if (snapshotRaw !== undefined && raw === snapshotRaw) {
    return snapshot;
  }

  snapshotRaw = raw;
  snapshot = parse(raw);
  return snapshot;
}

export function savePersonalQuickRange(option: TimeOption): void {
  const from = option.from.trim();
  const to = option.to.trim();
  const display = option.display.trim() || `${from} to ${to}`;
  if (!from || !to) {
    return;
  }

  const next = [
    { from, to, display },
    ...parse(readRaw()).filter((item) => item.from !== from || item.to !== to),
  ].slice(0, MAX_PERSONAL_QUICK_RANGES);
  write(next);
}

export function removePersonalQuickRange(option: Pick<TimeOption, 'from' | 'to'>): void {
  const next = parse(readRaw()).filter((item) => item.from !== option.from || item.to !== option.to);
  write(next);
}

export function subscribePersonalQuickRanges(listener: () => void): () => void {
  return store.subscribe(PERSONAL_QUICK_RANGES_STORAGE_KEY, () => {
    const raw = readRaw();
    if (raw !== snapshotRaw) {
      snapshotRaw = undefined;
    }
    listener();
  });
}

export function usePersonalQuickRanges(): TimeOption[] {
  return useSyncExternalStore(subscribePersonalQuickRanges, getPersonalQuickRanges, () => EMPTY);
}

function write(next: TimeOption[]): void {
  const stored = next.length === 0 ? EMPTY : next;
  // Publish the snapshot before store.setObject notifies subscribers, so getSnapshot stays stable.
  snapshot = stored;
  snapshotRaw = JSON.stringify(stored);
  try {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, stored);
  } catch {
    snapshotRaw = undefined;
  }
}

function readRaw(): string | null {
  return store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? null;
}

function parse(raw: string | null): TimeOption[] {
  if (!raw) {
    return EMPTY;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY;
  }

  if (!Array.isArray(parsed)) {
    return EMPTY;
  }

  const ranges: TimeOption[] = [];
  for (const item of parsed) {
    if (!isPersonalQuickRange(item)) {
      continue;
    }
    ranges.push({ from: item.from, to: item.to, display: item.display });
  }

  return ranges.length === 0 ? EMPTY : ranges;
}

function isPersonalQuickRange(value: unknown): value is TimeOption {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('from' in value) || !('to' in value) || !('display' in value)) {
    return false;
  }
  const { from, to, display } = value;
  return typeof from === 'string' && from !== '' && typeof to === 'string' && to !== '' && typeof display === 'string';
}

function rawBoundToString(value: TimeRange['raw']['from']): string {
  if (typeof value === 'string') {
    return value;
  }
  if (isDateTime(value) && value.toISOString) {
    return value.toISOString();
  }
  return '';
}
