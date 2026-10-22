import { isDateTime, rangeUtil, store, type RawTimeRange, type TimeOption, type TimeZone } from '@grafana/data';

// Stored outside the dashboard scene. Scene state is what gets written into the dashboard,
// so a viewer's saved ranges must not be copied onto the time picker scene object.
export const PERSONAL_TIME_RANGES_STORAGE_KEY = 'grafana.dashboard.timepicker.saved';
export const MAX_PERSONAL_TIME_RANGES = 20;

export interface StoredTimeRange {
  from: string;
  to: string;
  display: string;
}

export interface PersonalRangeWriteOptions {
  timeZone?: TimeZone;
  quickRanges?: TimeOption[];
}

type SaveState = 'ready' | 'saved' | 'invalid';

let cacheValid = false;
let cachedRaw: string | null = null;
let cachedRanges: StoredTimeRange[] = [];

export function subscribePersonalTimeRanges(onStoreChange: () => void): () => void {
  return store.subscribe(PERSONAL_TIME_RANGES_STORAGE_KEY, () => {
    cacheValid = false;
    onStoreChange();
  });
}

export function getPersonalTimeRangesSnapshot(): StoredTimeRange[] {
  const raw = readRaw();
  if (cacheValid && raw === cachedRaw) {
    return cachedRanges;
  }
  cachedRaw = raw;
  cachedRanges = parseStoredRanges(raw);
  cacheValid = true;
  return cachedRanges;
}

export function personalRangeFromRaw(range: RawTimeRange, options?: PersonalRangeWriteOptions): StoredTimeRange | null {
  const from = rawToString(range.from);
  const to = rawToString(range.to);
  if (!from || !to) {
    return null;
  }
  // describeTimeRange formats DateTimes in the dashboard timezone. Once they are ISO strings
  // it can only echo those strings, so the label has to be taken from the original value.
  const display = rangeUtil.describeTimeRange(
    isDateTime(range.from) || isDateTime(range.to) ? range : { from, to },
    options?.timeZone,
    options?.quickRanges
  );
  if (!display) {
    return null;
  }
  return { from, to, display };
}

export function getPersonalRangeSaveState(
  range: RawTimeRange | undefined,
  options?: PersonalRangeWriteOptions
): SaveState {
  if (!range) {
    return 'invalid';
  }
  const stored = personalRangeFromRaw(range, options);
  if (!stored) {
    return 'invalid';
  }
  const saved = getPersonalTimeRangesSnapshot().some((item) => item.from === stored.from && item.to === stored.to);
  return saved ? 'saved' : 'ready';
}

export function addPersonalTimeRange(range: RawTimeRange, options?: PersonalRangeWriteOptions): StoredTimeRange[] {
  const stored = personalRangeFromRaw(range, options);
  const current = getPersonalTimeRangesSnapshot();
  if (!stored || current.some((item) => item.from === stored.from && item.to === stored.to)) {
    return current;
  }
  return commit([stored, ...current].slice(0, MAX_PERSONAL_TIME_RANGES));
}

export function removePersonalTimeRange(range: { from: string; to: string }): StoredTimeRange[] {
  const current = getPersonalTimeRangesSnapshot();
  const next = current.filter((item) => item.from !== range.from || item.to !== range.to);
  if (next.length === current.length) {
    return current;
  }
  return commit(next);
}

function commit(ranges: StoredTimeRange[]): StoredTimeRange[] {
  const raw = JSON.stringify(ranges);
  cachedRaw = raw;
  cachedRanges = ranges;
  cacheValid = true;
  try {
    store.set(PERSONAL_TIME_RANGES_STORAGE_KEY, raw);
  } catch {
    cacheValid = false;
    return getPersonalTimeRangesSnapshot();
  }
  return ranges;
}

function readRaw(): string | null {
  const value = store.get(PERSONAL_TIME_RANGES_STORAGE_KEY);
  return typeof value === 'string' ? value : null;
}

function parseStoredRanges(raw: string | null): StoredTimeRange[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const ranges: StoredTimeRange[] = [];
    for (const item of parsed) {
      const stored = toStoredRange(item);
      if (stored) {
        ranges.push(stored);
      }
    }
    return ranges.slice(0, MAX_PERSONAL_TIME_RANGES);
  } catch {
    return [];
  }
}

function toStoredRange(value: unknown): StoredTimeRange | null {
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

function rawToString(value: RawTimeRange['from']): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (isDateTime(value) && value.isValid()) {
    return value.toISOString();
  }
  return null;
}
