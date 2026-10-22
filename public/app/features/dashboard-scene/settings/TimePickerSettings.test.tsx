import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectors } from '@grafana/e2e-selectors';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '@grafana/ui/internal';

import { TimePickerSettings } from './TimePickerSettings';

jest.mock('app/features/dashboard/services/TimeSrv', () => ({
  getTimeSrv: () => ({
    getValidIntervals: (intervals: string[]) => intervals,
  }),
}));

const dashboardRanges = [{ from: 'now-1h', to: 'now', display: 'Business hours' }];

function renderSettings() {
  const onTimeZoneChange = jest.fn();
  const onWeekStartChange = jest.fn();
  const onRefreshIntervalChange = jest.fn();
  const onNowDelayChange = jest.fn();
  const onHideTimePickerChange = jest.fn();
  const onLiveNowChange = jest.fn();

  render(
    <TimePickerSettings
      onTimeZoneChange={onTimeZoneChange}
      onWeekStartChange={onWeekStartChange}
      onRefreshIntervalChange={onRefreshIntervalChange}
      onNowDelayChange={onNowDelayChange}
      onHideTimePickerChange={onHideTimePickerChange}
      onLiveNowChange={onLiveNowChange}
      timezone="utc"
      dashboardQuickRanges={dashboardRanges}
    />
  );

  return {
    onTimeZoneChange,
    onWeekStartChange,
    onRefreshIntervalChange,
    onNowDelayChange,
    onHideTimePickerChange,
    onLiveNowChange,
  };
}

describe('TimePickerSettings personal quick ranges', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('adds and removes a personal range without changing dashboard settings', async () => {
    const user = userEvent.setup();
    const handlers = renderSettings();

    const dashboard = screen.getByTestId(selectors.components.TimePicker.dashboardRanges);
    expect(within(dashboard).getByText('Business hours')).toBeInTheDocument();
    expect(within(dashboard).queryByRole('button')).not.toBeInTheDocument();

    await user.type(screen.getByTestId(selectors.components.TimePicker.personalRangeDisplayInput), 'Morning');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalRangeFromInput), 'now-2h');
    await user.type(screen.getByTestId(selectors.components.TimePicker.personalRangeToInput), 'now');
    await user.click(screen.getByTestId(selectors.components.TimePicker.addPersonalRangeButton));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-2h', to: 'now', display: 'Morning' },
    ]);
    expect(within(dashboard).getByText('Business hours')).toBeInTheDocument();
    Object.values(handlers).forEach((handler) => expect(handler).not.toHaveBeenCalled());

    const row = screen.getByTestId(selectors.components.TimePicker.personalRangeRow('now-2h', 'now'));
    await user.click(within(row).getByRole('button', { name: 'Remove Morning' }));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(within(dashboard).getByText('Business hours')).toBeInTheDocument();
    Object.values(handlers).forEach((handler) => expect(handler).not.toHaveBeenCalled());
  });
});
