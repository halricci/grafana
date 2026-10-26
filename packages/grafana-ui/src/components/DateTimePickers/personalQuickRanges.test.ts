import { getDefaultTimeRange } from '@grafana/data';

import {
  getPersonalQuickRanges,
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  removePersonalQuickRange,
  savePersonalQuickRange,
  timeRangeToPersonalQuickRange,
} from './personalQuickRanges';

describe('personal quick ranges', () => {
  afterEach(() => {
    window.localStorage.clear();
    getPersonalQuickRanges();
  });

  it('ignores stored values that are not ranges', () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ from: 'now-5m', to: 'now', display: 'Five' }, { from: 'now-1h' }, null, 'nope'])
    );

    expect(getPersonalQuickRanges()).toEqual([{ from: 'now-5m', to: 'now', display: 'Five' }]);
  });

  it('saves a range in this browser and drops duplicates', () => {
    savePersonalQuickRange({ from: 'now-15m', to: 'now', display: 'Last 15 minutes' });
    savePersonalQuickRange({ from: 'now-15m', to: 'now', display: 'Quarter hour' });
    savePersonalQuickRange({ from: 'now-1h', to: 'now', display: 'Last 1 hour' });

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      { from: 'now-15m', to: 'now', display: 'Quarter hour' },
    ]);
  });

  it('keeps the 20 newest ranges', () => {
    for (let index = 0; index < 21; index++) {
      savePersonalQuickRange({ from: `now-${index}m`, to: 'now', display: `${index}` });
    }

    const stored = getPersonalQuickRanges();
    expect(stored).toHaveLength(20);
    expect(stored[0]).toEqual({ from: 'now-20m', to: 'now', display: '20' });
    expect(stored.some((range) => range.from === 'now-0m')).toBe(false);
  });

  it('does not save a blank range', () => {
    savePersonalQuickRange({ from: '  ', to: 'now', display: 'Blank' });

    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });

  it('removes only the matching range', () => {
    savePersonalQuickRange({ from: 'now-5m', to: 'now', display: 'Five' });
    savePersonalQuickRange({ from: 'now-1h', to: 'now', display: 'Hour' });

    removePersonalQuickRange({ from: 'now-5m', to: 'now' });

    expect(getPersonalQuickRanges()).toEqual([{ from: 'now-1h', to: 'now', display: 'Hour' }]);
  });

  it('names the current dashboard range without changing its from and to', () => {
    const option = timeRangeToPersonalQuickRange(getDefaultTimeRange(), 'utc');

    expect(option).toEqual({ from: 'now-6h', to: 'now', display: 'Last 6 hours' });
  });
});
