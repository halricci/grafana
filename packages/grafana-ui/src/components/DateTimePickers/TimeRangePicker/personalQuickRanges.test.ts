import { dateTime, store } from '@grafana/data';

import {
  MAX_PERSONAL_QUICK_RANGES,
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  createPersonalQuickRange,
  optionFromTimeRange,
  readPersonalQuickRanges,
  removePersonalQuickRange,
  upsertPersonalQuickRange,
  writePersonalQuickRanges,
} from './personalQuickRanges';

describe('personal quick ranges', () => {
  const historyKey = 'grafana.dashboard.timepicker.history';

  afterEach(() => {
    store.delete(PERSONAL_QUICK_RANGES_STORAGE_KEY);
    store.delete(historyKey);
  });

  it('ignores stored values that are not quick ranges', () => {
    store.set(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([
        { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
        { display: 'Missing to', from: 'now-2h' },
        { from: 'now-3h', to: 'now', display: 12 },
        null,
        'now-5m',
      ])
    );

    expect(readPersonalQuickRanges()).toEqual([{ display: 'Last 1 hour', from: 'now-1h', to: 'now' }]);
  });

  it('returns an empty list for invalid storage', () => {
    store.set(PERSONAL_QUICK_RANGES_STORAGE_KEY, '{');
    expect(readPersonalQuickRanges()).toEqual([]);

    store.set(PERSONAL_QUICK_RANGES_STORAGE_KEY, JSON.stringify({ from: 'now-1h' }));
    expect(readPersonalQuickRanges()).toEqual([]);
  });

  it('keeps the newest ranges and drops duplicates', () => {
    const existing = [
      { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
      { display: 'Last 2 hours', from: 'now-2h', to: 'now' },
    ];

    expect(upsertPersonalQuickRange({ display: 'Last 1 hour', from: 'now-1h', to: 'now' }, existing)).toEqual([
      { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
      { display: 'Last 2 hours', from: 'now-2h', to: 'now' },
    ]);

    const many = Array.from({ length: MAX_PERSONAL_QUICK_RANGES }, (_, index) => ({
      display: `Last ${index + 1} hours`,
      from: `now-${index + 1}h`,
      to: 'now',
    }));
    const saved = upsertPersonalQuickRange({ display: 'Last 30 minutes', from: 'now-30m', to: 'now' }, many);

    expect(saved).toHaveLength(MAX_PERSONAL_QUICK_RANGES);
    expect(saved[0]).toEqual({ display: 'Last 30 minutes', from: 'now-30m', to: 'now' });
    expect(saved.some((range) => range.from === 'now-20h')).toBe(false);
    expect(saved.some((range) => range.from === 'now-1h')).toBe(true);
  });

  it('removes only the matching range', () => {
    const existing = [
      { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
      { display: 'Last 2 hours', from: 'now-2h', to: 'now' },
    ];

    expect(removePersonalQuickRange({ from: 'now-1h', to: 'now' }, existing)).toEqual([
      { display: 'Last 2 hours', from: 'now-2h', to: 'now' },
    ]);
  });

  it('writes ranges without changing unrelated storage', () => {
    store.set(historyKey, '[]');

    writePersonalQuickRanges([{ display: 'Last 15 minutes', from: 'now-15m', to: 'now' }]);

    expect(JSON.parse(store.get(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { display: 'Last 15 minutes', from: 'now-15m', to: 'now' },
    ]);
    expect(store.get(historyKey)).toBe('[]');
  });

  it('builds a relative range from the text a user typed', () => {
    expect(createPersonalQuickRange(' now-1h ', ' now ', 'utc')).toEqual({
      ok: true,
      range: { display: 'Last 1 hour', from: 'now-1h', to: 'now' },
    });
  });

  it('rejects an empty, invalid, or reversed range', () => {
    expect(createPersonalQuickRange(' ', 'now', 'utc')).toEqual({ ok: false, error: 'empty' });
    expect(createPersonalQuickRange('nope', 'now', 'utc')).toEqual({ ok: false, error: 'invalid' });
    expect(createPersonalQuickRange('now', 'now-1h', 'utc')).toEqual({ ok: false, error: 'order' });
  });

  it('names the current relative range without turning it into an absolute one', () => {
    const now = dateTime('2022-12-03T00:00:00.000Z');
    expect(
      optionFromTimeRange(
        {
          from: now,
          to: now,
          raw: { from: 'now-6h', to: 'now' },
        },
        'utc'
      )
    ).toEqual({ display: 'Last 6 hours', from: 'now-6h', to: 'now' });
  });
});
