import { dateTime, getDefaultTimeRange, type TimeRange } from '@grafana/data';

import {
  normalizeQuickRange,
  parsePersonalQuickRanges,
  quickRangeInputError,
  storedQuickRangeFromTimeRange,
  withSavedRange,
  withoutRange,
  type StoredQuickRange,
} from './userQuickRanges';

describe('personal quick ranges', () => {
  it('keeps only complete ranges', () => {
    expect(
      parsePersonalQuickRanges([
        { from: 'now-1h', to: 'now', display: ' Hour ' },
        { from: 'now-1h', to: 'now' },
        null,
        'now-1h',
        { from: '', to: 'now', display: 'Missing from' },
      ])
    ).toEqual([{ from: 'now-1h', to: 'now', display: 'Hour' }]);

    expect(parsePersonalQuickRanges({ from: 'now-1h' })).toEqual([]);
  });

  it('replaces a saved range with the same from and to and caps the list at 20', () => {
    const existing: StoredQuickRange[] = [
      { from: 'now-1h', to: 'now', display: 'Old name' },
      { from: 'now-2h', to: 'now', display: 'Two hours' },
    ];

    expect(withSavedRange(existing, { from: 'now-1h', to: 'now', display: 'New name' })).toEqual([
      { from: 'now-1h', to: 'now', display: 'New name' },
      { from: 'now-2h', to: 'now', display: 'Two hours' },
    ]);

    const many = Array.from({ length: 20 }, (_, index) => ({
      from: `now-${index + 1}h`,
      to: 'now',
      display: `Range ${index + 1}`,
    }));

    const saved = withSavedRange(many, { from: 'now-30m', to: 'now', display: 'Newest' });
    expect(saved).toHaveLength(20);
    expect(saved[0]).toEqual({ from: 'now-30m', to: 'now', display: 'Newest' });
    expect(saved.some((range) => range.display === 'Range 20')).toBe(false);
  });

  it('removes only the matching range', () => {
    const existing: StoredQuickRange[] = [
      { from: 'now-1h', to: 'now', display: 'One hour' },
      { from: 'now-2h', to: 'now', display: 'Two hours' },
    ];

    expect(withoutRange(existing, { from: 'now-1h', to: 'now' })).toEqual([
      { from: 'now-2h', to: 'now', display: 'Two hours' },
    ]);
  });

  it('rejects a blank name or an unparseable endpoint', () => {
    expect(quickRangeInputError('  ', 'now-1h', 'now')).toBe('name');
    expect(quickRangeInputError('Deploy window', 'nope', 'now')).toBe('from');
    expect(quickRangeInputError('Deploy window', 'now-1h', 'nope')).toBe('to');
    expect(quickRangeInputError('Deploy window', 'now-1h', 'now')).toBeNull();
    expect(normalizeQuickRange(' Deploy window ', ' now-1h ', ' now ')).toEqual({
      display: 'Deploy window',
      from: 'now-1h',
      to: 'now',
    });
    expect(normalizeQuickRange('Outage', '2022-12-03T00:00:00.000Z', '2022-12-03T06:00:00.000Z')).toEqual({
      display: 'Outage',
      from: '2022-12-03T00:00:00.000Z',
      to: '2022-12-03T06:00:00.000Z',
    });
    expect(normalizeQuickRange('Bad', 'nope', 'now')).toBeNull();
  });

  it('stores the current range and keeps an existing name when none is typed', () => {
    const absolute: TimeRange = {
      from: dateTime('2022-12-03T00:00:00.000Z'),
      to: dateTime('2022-12-03T06:00:00.000Z'),
      raw: {
        from: dateTime('2022-12-03T00:00:00.000Z'),
        to: dateTime('2022-12-03T06:00:00.000Z'),
      },
    };

    expect(storedQuickRangeFromTimeRange(absolute, 'Outage', [])).toEqual({
      from: '2022-12-03T00:00:00.000Z',
      to: '2022-12-03T06:00:00.000Z',
      display: 'Outage',
    });
    expect(
      storedQuickRangeFromTimeRange(absolute, '  ', [
        { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T06:00:00.000Z', display: 'Kept' },
      ])
    ).toEqual({
      from: '2022-12-03T00:00:00.000Z',
      to: '2022-12-03T06:00:00.000Z',
      display: 'Kept',
    });
    expect(storedQuickRangeFromTimeRange(getDefaultTimeRange(), '', [])).toEqual({
      from: 'now-6h',
      to: 'now',
      display: 'Last 6 hours',
    });
  });
});
