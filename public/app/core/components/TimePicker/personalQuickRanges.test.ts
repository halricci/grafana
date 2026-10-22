import { type TimeOption } from '@grafana/data';

import {
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  readPersonalQuickRanges,
  sanitizePersonalQuickRanges,
  writePersonalQuickRanges,
} from './personalQuickRanges';

const HISTORY_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const HISTORY = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];

describe('personal quick ranges storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(HISTORY));
  });

  it('stores a relative range and reads it back', () => {
    writePersonalQuickRanges([{ from: 'now-1d/d', to: 'now-1d/d', display: 'Yesterday' }]);

    expect(readPersonalQuickRanges()).toEqual([{ from: 'now-1d/d', to: 'now-1d/d', display: 'Yesterday' }]);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? 'null')).toEqual(HISTORY);
  });

  it('drops absolute timestamps, duplicates, and a 21st range', () => {
    const ranges: TimeOption[] = [
      { from: '2020-01-01T00:00:00.000Z', to: '2020-01-02T00:00:00.000Z', display: 'Absolute' },
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      { from: 'now-1h', to: 'now', display: 'Last 1 hour again' },
      ...Array.from({ length: 20 }, (_, index) => ({
        from: `now-${index + 2}h`,
        to: 'now',
        display: `Last ${index + 2} hours`,
      })),
    ];

    expect(sanitizePersonalQuickRanges(ranges)).toEqual([
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      ...Array.from({ length: 19 }, (_, index) => ({
        from: `now-${index + 2}h`,
        to: 'now',
        display: `Last ${index + 2} hours`,
      })),
    ]);
  });

  it('ignores corrupt storage and values that are not ranges', () => {
    window.localStorage.setItem(PERSONAL_QUICK_RANGES_STORAGE_KEY, '{');
    expect(readPersonalQuickRanges()).toEqual([]);

    expect(sanitizePersonalQuickRanges({ from: 'now-1h', to: 'now', display: 'Last 1 hour' })).toEqual([]);
    expect(sanitizePersonalQuickRanges([{ from: 'now-1h', to: 'now', display: '   ' }])).toEqual([]);
  });
});
