import { validatePersonalQuickRange } from './personalQuickRangeForm';

describe('validatePersonalQuickRange', () => {
  it('trims a relative range', () => {
    expect(validatePersonalQuickRange({ display: ' Yesterday ', from: ' now-1d/d ', to: ' now-1d/d ' }, [])).toEqual({
      range: { display: 'Yesterday', from: 'now-1d/d', to: 'now-1d/d' },
    });
  });

  it('rejects an absolute timestamp', () => {
    expect(
      validatePersonalQuickRange(
        { display: 'Outage', from: '2020-01-01T00:00:00.000Z', to: '2020-01-02T00:00:00.000Z' },
        []
      )
    ).toEqual({
      error: 'Enter a name and a relative range, such as now-12h to now.',
    });
  });

  it('rejects a range the user already saved', () => {
    expect(
      validatePersonalQuickRange({ display: 'Last 6 hours', from: 'now-6h', to: 'now' }, [
        { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
      ])
    ).toEqual({ error: 'That range is already in your ranges.' });
  });

  it('rejects a 21st range', () => {
    const existing = Array.from({ length: 20 }, (_, index) => ({
      from: `now-${index + 1}h`,
      to: 'now',
      display: `Last ${index + 1} hours`,
    }));

    expect(validatePersonalQuickRange({ display: 'Last 2 days', from: 'now-2d', to: 'now' }, existing)).toEqual({
      error: 'You can save up to 20 ranges.',
    });
  });
});
