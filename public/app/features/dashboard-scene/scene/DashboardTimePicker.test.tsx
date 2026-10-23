import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { rangeUtil } from '@grafana/data';
import { type SceneTimePicker, sceneGraph } from '@grafana/scenes';

import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '../settings/personalQuickRanges';

import { DashboardTimePicker } from './DashboardTimePicker';

describe('DashboardTimePicker', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('shows dashboard and personal ranges and saves the current range outside dashboard state', async () => {
    const user = userEvent.setup();
    const dashboardRanges = [{ from: 'now-6h', to: 'now', display: 'Dashboard six hours' }];
    const model = {
      useState: () => ({ quickRanges: dashboardRanges }),
      onMoveBackward: jest.fn(),
      onMoveForward: jest.fn(),
      onZoom: jest.fn(),
      onChangeFiscalYearStartMonth: jest.fn(),
    } as unknown as SceneTimePicker;
    const onTimeRangeChange = jest.fn();
    const timeRange = {
      useState: () => ({
        value: rangeUtil.convertRawToRange({ from: 'now-5m', to: 'now' }, 'utc'),
      }),
      getTimeZone: () => 'utc',
      onTimeRangeChange,
      onTimeZoneChange: jest.fn(),
    };
    jest.spyOn(sceneGraph, 'getTimeRange').mockReturnValue(timeRange as never);
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ from: 'now-3h', to: 'now', display: 'My three hours' }])
    );

    render(<DashboardTimePicker model={model} />);
    await user.click(screen.getByLabelText(/Time range selected/));

    expect(screen.getByText('Your ranges')).toBeInTheDocument();
    expect(screen.getByText('Dashboard ranges')).toBeInTheDocument();
    expect(screen.getByText('My three hours')).toBeInTheDocument();
    expect(screen.getByText('Dashboard six hours')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save current range' }));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
      { from: 'now-3h', to: 'now', display: 'My three hours' },
    ]);
    expect(model.state?.quickRanges).toBeUndefined();
    expect(dashboardRanges).toEqual([{ from: 'now-6h', to: 'now', display: 'Dashboard six hours' }]);
    expect(onTimeRangeChange).not.toHaveBeenCalled();
  });
});
