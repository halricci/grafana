import { dateTime, store } from '@grafana/data';

import {
  MAX_PERSONAL_QUICK_RANGES,
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  readPersonalQuickRanges,
  timeRangeToPersonalQuickRange,
  withPersonalQuickRange,
  withoutPersonalQuickRange,
  writePersonalQuickRanges,
} from './personalQuickRanges';

const deployWindow = { display: 'Deploy window', from: 'now-6h', to: 'now' };
const lastWeek = { display: 'Last week', from: 'now-7d', to: 'now' };

describe('personal quick ranges', () => {
  beforeEach(() => {
    store.delete(PERSONAL_QUICK_RANGES_STORAGE_KEY);
  });

  it('adds a range without changing the list it was given', () => {
    const existing = [lastWeek];

    const next = withPersonalQuickRange(existing, deployWindow);

    expect(existing).toEqual([lastWeek]);
    expect(next).toEqual([deployWindow, lastWeek]);
  });

  it('replaces a saved range that has the same from and to', () => {
    const next = withPersonalQuickRange([deployWindow], { display: 'Shift change', from: 'now-6h', to: 'now' });

    expect(next).toEqual([{ display: 'Shift change', from: 'now-6h', to: 'now' }]);
  });

  it('rejects a blank name and leaves the list as it was', () => {
    const ranges = [deployWindow];

    expect(withPersonalQuickRange(ranges, { display: '   ', from: 'now-1h', to: 'now' })).toBe(ranges);
  });

  it('keeps at most 20 ranges, with the newest first', () => {
    const existing = Array.from({ length: MAX_PERSONAL_QUICK_RANGES }, (_, index) => ({
      display: `Range ${index}`,
      from: `now-${index + 1}h`,
      to: 'now',
    }));

    const next = withPersonalQuickRange(existing, lastWeek);

    expect(next).toHaveLength(MAX_PERSONAL_QUICK_RANGES);
    expect(next[0]).toEqual(lastWeek);
    expect(next.find((range) => range.display === 'Range 19')).toBeUndefined();
  });

  it('removes only the matching from and to', () => {
    const next = withoutPersonalQuickRange([deployWindow, lastWeek], deployWindow);

    expect(next).toEqual([lastWeek]);
  });

  it('round-trips valid ranges and drops entries that are not a display, from, and to', () => {
    writePersonalQuickRanges([
      deployWindow,
      { display: '  Padded  ', from: ' now-1h ', to: ' now ' },
      { display: '', from: 'now-1h', to: 'now' },
    ]);
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, [
      deployWindow,
      { display: 'Broken', from: 'now-1h' },
      'nope',
      null,
    ]);

    expect(readPersonalQuickRanges()).toEqual([deployWindow]);
  });

  it('returns an empty list when storage is not an array', () => {
    store.setObject(PERSONAL_QUICK_RANGES_STORAGE_KEY, { display: 'Deploy window' });

    expect(readPersonalQuickRanges()).toEqual([]);
  });

  it('stores the raw from and to of the current time range', () => {
    const saved = timeRangeToPersonalQuickRange(
      {
        from: dateTime('2026-01-01T00:00:00.000Z'),
        to: dateTime('2026-01-02T00:00:00.000Z'),
        raw: { from: 'now-2d', to: 'now' },
      },
      '  Two days  '
    );

    expect(saved).toEqual({ display: 'Two days', from: 'now-2d', to: 'now' });
  });

  it('stores absolute endpoints as ISO strings', () => {
    const from = dateTime('2026-03-01T00:00:00.000Z');
    const to = dateTime('2026-03-02T00:00:00.000Z');

    expect(
      timeRangeToPersonalQuickRange(
        {
          from,
          to,
          raw: { from, to },
        },
        'Outage'
      )
    ).toEqual({
      display: 'Outage',
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-02T00:00:00.000Z',
    });
  });
});
