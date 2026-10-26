import {
  PERSONAL_QUICK_RANGES_STORAGE_KEY,
  addPersonalQuickRange,
  getPersonalQuickRanges,
  removePersonalQuickRange,
} from './personalQuickRanges';

describe('personal quick ranges', () => {
  const historyKey = 'grafana.dashboard.timepicker.history';

  afterEach(() => {
    window.localStorage.clear();
  });

  it('stores the newest ten unique ranges without changing time picker history', () => {
    window.localStorage.setItem(historyKey, JSON.stringify([{ from: '2024-01-01', to: '2024-01-02' }]));

    for (let index = 0; index < 11; index++) {
      addPersonalQuickRange({ from: `now-${index + 1}h`, to: 'now', display: `Last ${index + 1} hours` });
    }
    addPersonalQuickRange({ from: 'now-11h', to: 'now', display: 'Duplicate' });

    expect(getPersonalQuickRanges()).toHaveLength(10);
    expect(getPersonalQuickRanges()[0]).toEqual({ from: 'now-11h', to: 'now', display: 'Duplicate' });
    expect(getPersonalQuickRanges()).not.toContainEqual({
      from: 'now-1h',
      to: 'now',
      display: 'Last 1 hours',
    });
    expect(JSON.parse(window.localStorage.getItem(historyKey) ?? '[]')).toEqual([
      { from: '2024-01-01', to: '2024-01-02' },
    ]);
  });

  it('ignores malformed stored values and removes a range by its endpoints', () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([
        { from: 'now-3h', to: 'now', display: 'Last 3 hours' },
        { from: 'now-6h', to: null, display: 'Invalid' },
        { from: 'now-9h', to: 'now', display: 'Extra property', extra: true },
      ])
    );

    expect(getPersonalQuickRanges()).toEqual([{ from: 'now-3h', to: 'now', display: 'Last 3 hours' }]);

    removePersonalQuickRange({ from: 'now-3h', to: 'now', display: 'Different label' });

    expect(getPersonalQuickRanges()).toEqual([]);
  });
});
