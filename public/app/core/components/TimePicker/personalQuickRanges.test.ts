import { act, renderHook } from '@testing-library/react';

import {
  addPersonalQuickRange,
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  readPersonalQuickRanges,
  removePersonalQuickRange,
  usePersonalQuickRanges,
} from './personalQuickRanges';

describe('personal quick ranges', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('drops stored values that are not quick ranges', () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([
        null,
        { from: 'now-1h', to: 'now' },
        { from: '', to: 'now', display: 'Blank' },
        { from: 'now-2h', to: 'now', display: 'Last 2 hours', section: 1 },
        { from: 'now-2h', to: 'now', display: 'Duplicate' },
      ])
    );

    expect(readPersonalQuickRanges()).toEqual([{ from: 'now-2h', to: 'now', display: 'Last 2 hours' }]);
  });

  it('returns no ranges when storage is not a list', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem(PERSONAL_QUICK_RANGES_STORAGE_KEY, '{');

    expect(readPersonalQuickRanges()).toEqual([]);
    error.mockRestore();
  });

  it('keeps the newest copy of a range and caps the list at 20', () => {
    let ranges = [] as ReturnType<typeof readPersonalQuickRanges>;
    for (let index = 0; index < 21; index++) {
      ranges = addPersonalQuickRange(ranges, {
        from: `now-${index}h`,
        to: 'now',
        display: `Last ${index} hours`,
      });
    }

    ranges = addPersonalQuickRange(ranges, { from: 'now-1h', to: 'now', display: 'One hour' });

    expect(ranges).toHaveLength(20);
    expect(ranges[0]).toEqual({ from: 'now-1h', to: 'now', display: 'One hour' });
    expect(ranges.filter((range) => range.from === 'now-1h')).toHaveLength(1);
    expect(ranges.some((range) => range.from === 'now-0h')).toBe(false);
  });

  it('removes only the matching range', () => {
    const ranges = [
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      { from: 'now-1d', to: 'now', display: 'Last 1 day' },
    ];

    expect(removePersonalQuickRange(ranges, { from: 'now-1h', to: 'now' })).toEqual([
      { from: 'now-1d', to: 'now', display: 'Last 1 day' },
    ]);
  });

  it('shares updates between subscribers', () => {
    const first = renderHook(() => usePersonalQuickRanges());
    const second = renderHook(() => usePersonalQuickRanges());

    act(() => {
      first.result.current.add({ from: 'now-12h', to: 'now', display: 'Overnight' });
    });

    expect(second.result.current.ranges).toEqual([{ from: 'now-12h', to: 'now', display: 'Overnight' }]);
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-12h', to: 'now', display: 'Overnight' },
    ]);

    act(() => {
      second.result.current.remove({ from: 'now-12h', to: 'now' });
    });

    expect(first.result.current.ranges).toEqual([]);
  });
});
