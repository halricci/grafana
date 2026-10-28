import { act, renderHook } from '@testing-library/react';

import { dateTime, type TimeOption } from '@grafana/data';

import {
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  addPersonalQuickRange,
  parsePersonalQuickRanges,
  parseQuickRangeInput,
  removePersonalQuickRange,
  toPersonalQuickRange,
  usePersonalQuickRanges,
} from './personalQuickRanges';

const HISTORY_KEY = 'grafana.dashboard.timepicker.history';

describe('personal quick ranges', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a range without mutating the list it was given', () => {
    const current = [{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }];

    const next = addPersonalQuickRange(current, { from: 'now-5m', to: 'now', display: 'Last 5 minutes' });

    expect(current).toEqual([{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }]);
    expect(next).toEqual([
      { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
    ]);
  });

  it('replaces a duplicate and keeps the newest ten ranges', () => {
    let ranges: TimeOption[] = [];
    for (let minute = 1; minute <= 11; minute++) {
      ranges = addPersonalQuickRange(ranges, {
        from: `now-${minute}m`,
        to: 'now',
        display: `Last ${minute} minutes`,
      });
    }

    expect(ranges).toHaveLength(10);
    expect(ranges[0]).toEqual({ from: 'now-11m', to: 'now', display: 'Last 11 minutes' });
    expect(ranges.some((range) => range.from === 'now-1m')).toBe(false);

    const updated = addPersonalQuickRange(ranges, { from: 'now-11m', to: 'now', display: 'Eleven minutes' });
    expect(updated[0]).toEqual({ from: 'now-11m', to: 'now', display: 'Eleven minutes' });
    expect(updated.filter((range) => range.from === 'now-11m')).toHaveLength(1);
  });

  it('drops stored values that are not quick ranges', () => {
    expect(
      parsePersonalQuickRanges([
        { from: 'now-5m', to: 'now' },
        { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
        'nope',
      ])
    ).toEqual([{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }]);
    expect(parsePersonalQuickRanges({ from: 'now-5m' })).toEqual([]);
  });

  it('names a relative range from its raw from and to', () => {
    expect(
      toPersonalQuickRange({
        from: dateTime('2020-01-01T00:00:00.000Z'),
        to: dateTime('2020-01-01T01:00:00.000Z'),
        raw: { from: 'now-1h', to: 'now' },
      })
    ).toEqual({ from: 'now-1h', to: 'now', display: 'Last 1 hour' });
    expect(
      toPersonalQuickRange({
        from: dateTime('2020-01-01T00:00:00.000Z'),
        to: dateTime('2020-01-01T01:00:00.000Z'),
        raw: { from: '', to: 'now' },
      })
    ).toBeNull();
  });

  it('parses a dashboard or personal range input', () => {
    expect(parseQuickRangeInput('  now-5m  ', ' now ', '  Morning ')).toEqual({
      from: 'now-5m',
      to: 'now',
      display: 'Morning',
    });
    expect(parseQuickRangeInput('now-45m', 'now')).toEqual({
      from: 'now-45m',
      to: 'now',
      display: 'Last 45 minutes',
    });
    expect(parseQuickRangeInput('not a range', 'still not')).toBeNull();
  });

  it('removes only the matching range', () => {
    const current = [
      { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
    ];

    expect(removePersonalQuickRange(current, { from: 'now-5m', to: 'now' })).toEqual([
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
    ]);
    expect(current).toHaveLength(2);
  });

  it('stores personal ranges without writing recently used ranges', () => {
    localStorage.setItem(HISTORY_KEY, '[]');
    const { result } = renderHook(() => usePersonalQuickRanges());

    act(() => {
      result.current.saveTimeRange({
        from: dateTime('2020-01-01T00:00:00.000Z'),
        to: dateTime('2020-01-01T01:00:00.000Z'),
        raw: { from: 'now-5m', to: 'now' },
      });
    });

    expect(result.current.ranges).toEqual([{ from: 'now-5m', to: 'now', display: 'Last 5 minutes' }]);
    expect(JSON.parse(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([
      { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
    ]);
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]');

    act(() => {
      result.current.remove({ from: 'now-5m', to: 'now' });
    });

    expect(result.current.ranges).toEqual([]);
    expect(localStorage.getItem(HISTORY_KEY)).toBe('[]');
  });
});
