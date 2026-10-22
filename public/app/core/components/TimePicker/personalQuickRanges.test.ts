import { dateTime } from '@grafana/data';

import {
  addPersonalQuickRange,
  createPersonalQuickRange,
  parsePersonalQuickRanges,
  quickRangeFromRaw,
  removePersonalQuickRange,
} from './personalQuickRanges';

describe('personal quick ranges', () => {
  const last45m = { from: 'now-45m', to: 'now', display: 'Last 45 minutes' };

  it('turns a duration into a relative quick range', () => {
    expect(createPersonalQuickRange('45m', '', '')).toEqual(last45m);
    expect(createPersonalQuickRange('45m', 'now', 'Morning')).toEqual({
      from: 'now-45m',
      to: 'now',
      display: 'Morning',
    });
  });

  it('keeps an explicit relative range', () => {
    expect(createPersonalQuickRange('now/d', 'now/d', '')).toEqual({
      from: 'now/d',
      to: 'now/d',
      display: 'Today',
    });
  });

  it('rejects values that are not relative ranges', () => {
    expect(createPersonalQuickRange('nope', 'now', '')).toBeNull();
    expect(createPersonalQuickRange('2022-12-03T00:00:00.000Z', '2022-12-03T23:59:59.000Z', 'Day')).toBeNull();
    expect(
      quickRangeFromRaw({ from: dateTime('2022-12-03T00:00:00.000Z'), to: dateTime('2022-12-03T23:59:59.000Z') })
    ).toBeNull();
  });

  it('drops invalid stored items and keeps a custom name', () => {
    expect(
      parsePersonalQuickRanges([
        { from: 'now-45m', to: 'now', display: 'Morning' },
        { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z', display: 'Day' },
        { from: 'now-1h' },
        'Last 5 minutes',
        null,
      ])
    ).toEqual([{ from: 'now-45m', to: 'now', display: 'Morning' }]);
    expect(parsePersonalQuickRanges({ from: 'now-45m' })).toEqual([]);
  });

  it('adds a range without changing the previous list, and drops the oldest past 20', () => {
    const existing = [last45m];
    const added = addPersonalQuickRange(existing, { from: 'now-2h', to: 'now', display: 'Last 2 hours' });

    expect(existing).toEqual([last45m]);
    expect(added).toEqual([{ from: 'now-2h', to: 'now', display: 'Last 2 hours' }, last45m]);

    const many = Array.from({ length: 20 }, (_, index) => ({
      from: `now-${index + 1}m`,
      to: 'now',
      display: `Last ${index + 1} minutes`,
    }));
    const next = addPersonalQuickRange(many, { from: 'now-2h', to: 'now', display: 'Last 2 hours' });

    expect(next).toHaveLength(20);
    expect(next[0]).toEqual({ from: 'now-2h', to: 'now', display: 'Last 2 hours' });
    expect(next.some((range) => range.from === 'now-20m')).toBe(false);
    expect(addPersonalQuickRange(existing, { from: 'yesterday', to: 'now', display: 'Nope' })).toBe(existing);
  });

  it('removes only the matching range', () => {
    const existing = [last45m, { from: 'now-2h', to: 'now', display: 'Last 2 hours' }];

    expect(removePersonalQuickRange(existing, last45m)).toEqual([
      { from: 'now-2h', to: 'now', display: 'Last 2 hours' },
    ]);
    expect(existing).toHaveLength(2);
  });
});
