import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectors } from '@grafana/e2e-selectors';
import { SceneTimePicker, SceneTimeRange } from '@grafana/scenes';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from 'app/core/components/TimePicker/personalQuickRanges';

import { DashboardControls } from './DashboardControls';
import { DashboardScene } from './DashboardScene';
import { DashboardTimePicker } from './DashboardTimePicker';

const HISTORY_KEY = 'grafana.dashboard.timepicker.history';

describe('DashboardTimePicker', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows a personal range from a previous visit beside dashboard ranges', async () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ from: 'now-12h', to: 'now', display: 'Overnight' }])
    );
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }])
    );

    renderPicker();

    await userEvent.click(screen.getByTestId(selectors.components.TimePicker.openButton));

    expect(screen.getByTestId(selectors.components.TimePicker.personalQuickRanges)).toHaveTextContent('Overnight');
    expect(screen.getByTestId(selectors.components.TimePicker.dashboardQuickRanges)).toHaveTextContent(
      'Last 15 minutes'
    );
    expect(screen.getByText(/Recently used absolute ranges/i)).toBeInTheDocument();
    expect(screen.getByText(/2022-12-03 00:00:00 to 2022-12-03 23:59:59/i)).toBeInTheDocument();
  });

  it('saving or removing a personal range leaves the dashboard and recent history unchanged', async () => {
    const { timePicker } = renderPicker();
    const quickRanges = timePicker.state.quickRanges;

    await userEvent.click(screen.getByTestId(selectors.components.TimePicker.openButton));
    await userEvent.click(screen.getByRole('button', { name: 'Save current range' }));

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ]);
    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? 'null')).toEqual([]);
    expect(screen.getByText(/It looks like you haven't used this time picker before/i)).toBeInTheDocument();
    expect(screen.getByText('Last 15 minutes')).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId(selectors.components.TimePicker.removePersonalQuickRange('now-6h', 'now'))
    );

    expect(readStoredPersonalRanges()).toEqual([]);
    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(screen.getByText('Last 15 minutes')).toBeInTheDocument();
  });

  it('keeps an empty dashboard quick range list from falling back to the built-in ranges', async () => {
    renderPicker([]);

    await userEvent.click(screen.getByTestId(selectors.components.TimePicker.openButton));

    expect(screen.queryByTestId(selectors.components.TimePicker.dashboardQuickRanges)).not.toBeInTheDocument();
    expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save current range' })).toBeInTheDocument();
  });
});

function renderPicker(quickRanges: Array<{ from: string; to: string; display: string }> | undefined = undefined) {
  const timePicker = new SceneTimePicker({
    quickRanges: quickRanges === undefined ? [{ from: 'now-15m', to: 'now', display: 'Last 15 minutes' }] : quickRanges,
  });
  const dashboard = new DashboardScene({
    $timeRange: new SceneTimeRange({ from: 'now-6h', to: 'now', timeZone: 'utc' }),
    controls: new DashboardControls({ timePicker }),
  });
  dashboard.activate();

  render(<DashboardTimePicker model={timePicker} />);
  return { timePicker, dashboard };
}

function readStoredPersonalRanges(): unknown {
  return JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]');
}
