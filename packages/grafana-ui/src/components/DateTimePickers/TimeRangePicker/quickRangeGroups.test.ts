import { isRelativeTimeExpression, rangesEqual } from './quickRangeGroups';

describe('isRelativeTimeExpression', () => {
  it.each(['now-6h', 'now-1d/d', 'now/d', '5m', '1h'])('accepts %s', (value) => {
    expect(isRelativeTimeExpression(value)).toBe(true);
  });

  it.each(['', '   ', 'not a range', '2020-01-01T00:00:00.000Z', '2020-01-02 00:00:00'])('rejects %s', (value) => {
    expect(isRelativeTimeExpression(value)).toBe(false);
  });
});

describe('rangesEqual', () => {
  const dashboard = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];

  it('matches the same from, to, and display in order', () => {
    expect(rangesEqual(dashboard, [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }])).toBe(true);
  });

  it('does not match an empty dashboard list or a different display', () => {
    expect(rangesEqual(undefined, dashboard)).toBe(false);
    expect(rangesEqual([], dashboard)).toBe(false);
    expect(rangesEqual(dashboard, [{ from: 'now-6h', to: 'now', display: 'Last 6 hrs' }])).toBe(false);
  });
});
