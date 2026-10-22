import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SceneTimePicker, SceneTimeRange } from '@grafana/scenes';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { SceneTimePickerWithPersonalRanges } from './SceneTimePickerWithPersonalRanges';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from './personalQuickRanges';

const HISTORY_KEY = 'grafana.dashboard.timepicker.history';

describe('SceneTimePickerWithPersonalRanges', () => {
  const dashboardQuickRanges = [{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }];

  afterEach(() => {
    window.localStorage.clear();
  });

  it('keeps dashboard quick ranges unchanged when a personal range is saved or removed', async () => {
    const user = userEvent.setup();
    const { timePicker } = setup();

    render(<SceneTimePickerWithPersonalRanges model={timePicker} />);
    await user.click(screen.getByLabelText(/Time range selected/));
    expect(screen.getByRole('region', { name: 'Dashboard' })).toHaveTextContent('Last 1 hour');
    expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Last 6 hours to your ranges' }));
    await user.click(screen.getByRole('button', { name: 'Remove Last 6 hours' }));

    expect(timePicker.state.quickRanges).toEqual(dashboardQuickRanges);
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([]);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('still records recently used absolute ranges', async () => {
    const user = userEvent.setup();
    const { timePicker } = setup();

    render(<SceneTimePickerWithPersonalRanges model={timePicker} />);
    await user.click(screen.getByLabelText(/Time range selected/));
    await user.clear(screen.getByLabelText('From'));
    await user.type(screen.getByLabelText('From'), '2022-12-03 00:00:00');
    await user.clear(screen.getByLabelText('To'));
    await user.type(screen.getByLabelText('To'), '2022-12-03 23:59:59');
    await user.click(screen.getByRole('button', { name: 'Apply time range' }));

    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? 'null')).toEqual([
      { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' },
    ]);
    expect(timePicker.state.quickRanges).toEqual(dashboardQuickRanges);
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });
});

function setup() {
  const timePicker = new SceneTimePicker({ quickRanges: dashboardRanges() });
  const dashboard = new DashboardScene({
    title: 'Test',
    uid: 'dash-1',
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now', timeZone: 'utc' }),
    controls: new DashboardControls({ timePicker }),
  });
  dashboard.activate();
  return { dashboard, timePicker };
}

function dashboardRanges() {
  return [{ from: 'now-1h', to: 'now', display: 'Last 1 hour' }];
}
