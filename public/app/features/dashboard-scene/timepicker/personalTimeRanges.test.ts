import { dateTime } from '@grafana/data';

import {
  PERSONAL_TIME_RANGES_STORAGE_KEY,
  addPersonalTimeRange,
  getPersonalRangeSaveState,
  getPersonalTimeRangesSnapshot,
  removePersonalTimeRange,
} from './personalTimeRanges';

const HISTORY_STORAGE_KEY = 'grafana.dashboard.timepicker.history';

describe('personalTimeRanges', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a relative range under its described label', () => {
    expect(addPersonalTimeRange({ from: 'now-15m', to: 'now' })).toEqual([
      { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
    ]);
    expect(getPersonalTimeRangesSnapshot()).toEqual([{ from: 'now-15m', to: 'now', display: 'Last 15 minutes' }]);
    expect(getPersonalRangeSaveState({ from: 'now-15m', to: 'now' })).toBe('saved');
    expect(getPersonalRangeSaveState({ from: 'now-5m', to: 'now' })).toBe('ready');
  });

  it('stores an absolute range as ISO strings with a UTC description', () => {
    expect(
      addPersonalTimeRange(
        {
          from: dateTime('2020-01-01T00:00:00.000Z'),
          to: dateTime('2020-01-02T00:00:00.000Z'),
        },
        { timeZone: 'utc' }
      )
    ).toEqual([
      {
        from: '2020-01-01T00:00:00.000Z',
        to: '2020-01-02T00:00:00.000Z',
        display: '2020-01-01 00:00:00 to 2020-01-02 00:00:00',
      },
    ]);
  });

  it('keeps a single entry when the same range is saved twice', () => {
    const first = addPersonalTimeRange({ from: 'now-5m', to: 'now' });
    const second = addPersonalTimeRange({ from: 'now-5m', to: 'now' });

    expect(second).toBe(first);
    expect(second).toEqual([{ from: 'now-5m', to: 'now', display: 'Last 5 minutes' }]);
  });

  it('uses the dashboard quick range name when the raw range matches one', () => {
    expect(
      addPersonalTimeRange(
        { from: 'now-6h', to: 'now' },
        { quickRanges: [{ from: 'now-6h', to: 'now', display: 'Since the handoff' }] }
      )
    ).toEqual([{ from: 'now-6h', to: 'now', display: 'Since the handoff' }]);
  });

  it('drops stored values that are not saved ranges', () => {
    localStorage.setItem(
      PERSONAL_TIME_RANGES_STORAGE_KEY,
      JSON.stringify([
        { from: 'now-5m', to: 'now' },
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
        { from: '', to: 'now', display: 'blank' },
      ])
    );

    expect(getPersonalTimeRangesSnapshot()).toEqual([{ from: 'now-15m', to: 'now', display: 'Last 15 minutes' }]);

    localStorage.setItem(PERSONAL_TIME_RANGES_STORAGE_KEY, 'not-json');
    expect(getPersonalTimeRangesSnapshot()).toEqual([]);
    expect(getPersonalRangeSaveState({ from: '   ', to: 'now' })).toBe('invalid');
  });

  it('removes only the matching range', () => {
    addPersonalTimeRange({ from: 'now-5m', to: 'now' });
    addPersonalTimeRange({ from: 'now-15m', to: 'now' });

    const before = getPersonalTimeRangesSnapshot();
    expect(removePersonalTimeRange({ from: 'now-1d', to: 'now' })).toBe(before);
    expect(removePersonalTimeRange({ from: 'now-5m', to: 'now' })).toEqual([
      { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
    ]);
  });

  it('keeps the 20 newest ranges', () => {
    for (let minute = 1; minute <= 21; minute++) {
      addPersonalTimeRange({ from: `now-${minute}m`, to: 'now' });
    }

    const ranges = getPersonalTimeRangesSnapshot();
    expect(ranges).toHaveLength(20);
    expect(ranges[0]).toEqual({ from: 'now-21m', to: 'now', display: 'Last 21 minutes' });
    expect(ranges[19]).toEqual({ from: 'now-2m', to: 'now', display: 'Last 2 minutes' });
  });

  it('does not rewrite recently used ranges', () => {
    const history = '[{"from":"2020-01-01T00:00:00.000Z","to":"2020-01-02T00:00:00.000Z"}]';
    localStorage.setItem(HISTORY_STORAGE_KEY, history);

    addPersonalTimeRange({ from: 'now-15m', to: 'now' });
    removePersonalTimeRange({ from: 'now-15m', to: 'now' });

    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe(history);
    expect(localStorage.getItem(PERSONAL_TIME_RANGES_STORAGE_KEY)).toBe('[]');
  });
});
