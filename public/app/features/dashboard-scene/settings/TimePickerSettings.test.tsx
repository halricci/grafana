import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectors } from '@grafana/e2e-selectors';

import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '../../../core/components/TimePicker/personalQuickRanges';

import { TimePickerSettings } from './TimePickerSettings';

const HISTORY_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const HISTORY = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];
const DASHBOARD_RANGES = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];

describe('TimePickerSettings personal ranges', () => {
  const onTimeZoneChange = jest.fn();
  const onWeekStartChange = jest.fn();
  const onRefreshIntervalChange = jest.fn();
  const onNowDelayChange = jest.fn();
  const onHideTimePickerChange = jest.fn();
  const onLiveNowChange = jest.fn();

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(HISTORY));
    jest.clearAllMocks();
  });

  it('adds and removes a personal range without changing dashboard ranges or recently used ranges', async () => {
    const user = userEvent.setup();
    const dashboardRanges = [...DASHBOARD_RANGES];

    const view = render(
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

    expect(screen.getByText('Last 6 hours (now-6h to now)')).toBeInTheDocument();
    expect(screen.getByText('You have not saved any ranges yet.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Range name' }), 'Last 12 hours');
    await user.type(screen.getByRole('textbox', { name: 'From' }), 'now-12h');
    await user.type(screen.getByRole('textbox', { name: 'To' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Add to your ranges' }));

    expect(screen.getByText('Last 12 hours (now-12h to now)')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([
      { from: 'now-12h', to: 'now', display: 'Last 12 hours' },
    ]);
    expect(dashboardRanges).toEqual(DASHBOARD_RANGES);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? 'null')).toEqual(HISTORY);
    expect(onTimeZoneChange).not.toHaveBeenCalled();
    expect(onWeekStartChange).not.toHaveBeenCalled();
    expect(onRefreshIntervalChange).not.toHaveBeenCalled();
    expect(onNowDelayChange).not.toHaveBeenCalled();
    expect(onHideTimePickerChange).not.toHaveBeenCalled();
    expect(onLiveNowChange).not.toHaveBeenCalled();

    view.unmount();
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
    expect(screen.getByText('Last 12 hours (now-12h to now)')).toBeInTheDocument();

    const row = screen.getByTestId(selectors.components.TimePickerSettings.personalQuickRange('now-12h', 'now'));
    await user.click(within(row).getByRole('button', { name: 'Remove Last 12 hours from your ranges' }));

    expect(screen.queryByText('Last 12 hours (now-12h to now)')).not.toBeInTheDocument();
    expect(screen.getByText('Last 6 hours (now-6h to now)')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([]);
    expect(dashboardRanges).toEqual(DASHBOARD_RANGES);
    expect(onTimeZoneChange).not.toHaveBeenCalled();
  });

  it('rejects an absolute range and leaves storage empty', async () => {
    const user = userEvent.setup();
    render(
      <TimePickerSettings
        onTimeZoneChange={onTimeZoneChange}
        onWeekStartChange={onWeekStartChange}
        onRefreshIntervalChange={onRefreshIntervalChange}
        onNowDelayChange={onNowDelayChange}
        onHideTimePickerChange={onHideTimePickerChange}
        onLiveNowChange={onLiveNowChange}
        timezone="utc"
        dashboardQuickRanges={DASHBOARD_RANGES}
      />
    );

    await user.type(screen.getByRole('textbox', { name: 'Range name' }), 'Outage');
    await user.type(screen.getByRole('textbox', { name: 'From' }), '2020-01-01T00:00:00.000Z');
    await user.type(screen.getByRole('textbox', { name: 'To' }), '2020-01-02T00:00:00.000Z');
    await user.click(screen.getByRole('button', { name: 'Add to your ranges' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name and a relative range, such as now-12h to now.');
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
    expect(screen.getByText('Last 6 hours (now-6h to now)')).toBeInTheDocument();
  });
});
