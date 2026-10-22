import { store } from '@grafana/data';

import {
  MAX_PERSONAL_QUICK_RANGES,
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  addPersonalQuickRange,
  normalizeQuickRange,
  readPersonalQuickRanges,
  removePersonalQuickRange,
  writePersonalQuickRanges,
} from './personalQuickRanges';

const HISTORY_KEY = 'grafana.dashboard.timepicker.history';

describe('personal quick ranges', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('names a bare duration the same way the time picker does', () => {
    expect(normalizeQuickRange('5m', 'now')).toEqual({
      from: 'now-5m',
      to: 'now',
      display: 'Last 5 minutes',
    });
  });

  it('keeps a name the user typed', () => {
    expect(normalizeQuickRange('now-2h', 'now', 'Morning standup')).toEqual({
      from: 'now-2h',
      to: 'now',
      display: 'Morning standup',
    });
  });

  it('rejects an absolute range', () => {
    expect(normalizeQuickRange('2024-01-01', '2024-01-02', 'January')).toBeNull();
  });

  it('adds a range without changing the list it was given', () => {
    const existing = [{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }];
    const snapshot = [...existing];

    const result = addPersonalQuickRange(existing, {
      from: 'now-6h',
      to: 'now',
      display: 'Last 6 hours',
    });

    expect(result).toEqual({
      ok: true,
      ranges: [
        { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
        { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      ],
    });
    expect(existing).toEqual(snapshot);
  });

  it('does not add the same from and to twice', () => {
    const existing = [{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }];

    expect(addPersonalQuickRange(existing, { from: 'now-1h', to: 'now', display: 'Another name' })).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });

  it('stops at the saved-range limit', () => {
    const existing = Array.from({ length: MAX_PERSONAL_QUICK_RANGES }, (_, index) => ({
      from: `now-${index + 1}m`,
      to: 'now',
      display: `Last ${index + 1} minutes`,
    }));

    expect(addPersonalQuickRange(existing, { from: 'now-1h', to: 'now', display: 'Last 1 hour' })).toEqual({
      ok: false,
      reason: 'limit',
    });
  });

  it('removes one range and leaves the others', () => {
    const existing = [
      { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ];

    expect(removePersonalQuickRange(existing, { from: 'now-1h', to: 'now' })).toEqual([
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ]);
    expect(existing).toHaveLength(2);
  });

  it('drops stored values that are not relative ranges', () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
        { from: '2024-01-01T00:00:00.000Z', to: '2024-01-02T00:00:00.000Z', display: 'Absolute' },
        { from: 'now-1h', to: 'now' },
        'nope',
      ])
    );

    expect(readPersonalQuickRanges()).toEqual([{ from: 'now-15m', to: 'now', display: 'Last 15 minutes' }]);
  });

  it('writes personal ranges without changing recently used ranges', () => {
    const history = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];
    store.setObject(HISTORY_KEY, history);

    writePersonalQuickRanges([{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }]);

    expect(store.getObject(HISTORY_KEY)).toEqual(history);
    expect(readPersonalQuickRanges()).toEqual([{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }]);
  });
});
