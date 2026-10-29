import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { getGrafanaContextMock } from 'test/mocks/getGrafanaContextMock';

import { type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { SceneTimePicker, SceneTimeRange } from '@grafana/scenes';
import { getTestFeatureFlagClient } from '@grafana/test-utils/unstable';
import { GrafanaContext } from 'app/core/context/GrafanaContext';

import { DashboardControls } from '../scene/DashboardControls';
import { DashboardScene } from '../scene/DashboardScene';

import { PERSONAL_TIME_RANGES_STORAGE_KEY } from './personalTimeRanges';

const HISTORY_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const HISTORY_VALUE = '[{"from":"2020-01-01T00:00:00.000Z","to":"2020-01-02T00:00:00.000Z"}]';

describe('Dashboard personal time ranges', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(HISTORY_STORAGE_KEY, HISTORY_VALUE);
  });

  it('lists your ranges apart from the dashboard ranges and leaves the dashboard unchanged', async () => {
    const user = userEvent.setup();
    const quickRanges: TimeOption[] = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];
    const { controls, timePicker, timeRange } = buildDashboard({
      uid: 'dash-a',
      from: 'now-2h',
      to: 'now',
      quickRanges,
    });

    renderInGrafanaContext(<controls.Component model={controls} />);
    await openTimePicker(user);

    const historyAfterOpen = localStorage.getItem(HISTORY_STORAGE_KEY);
    expect(historyAfterOpen).toContain('2020-01-01T00:00:00.000Z');

    const yours = screen.getByRole('region', { name: 'Your ranges' });
    const dashboard = screen.getByRole('region', { name: 'Dashboard' });
    expect(within(yours).getByText('Save a range to use it on every dashboard.')).toBeInTheDocument();
    expect(within(dashboard).getByText('Last 6 hours')).toBeInTheDocument();
    expect(within(yours).queryByText('Last 6 hours')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save current range' }));

    expect(within(yours).getByRole('button', { name: 'Last 2 hours' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Current range is already saved' })).toBeDisabled();
    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(timeRange.state.from).toBe('now-2h');
    expect(timeRange.state.to).toBe('now');
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe(historyAfterOpen);
    expect(JSON.parse(localStorage.getItem(PERSONAL_TIME_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-2h', to: 'now', display: 'Last 2 hours' },
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove Last 2 hours' }));

    expect(within(yours).queryByRole('button', { name: 'Last 2 hours' })).not.toBeInTheDocument();
    expect(within(yours).getByText('Save a range to use it on every dashboard.')).toBeInTheDocument();
    expect(timePicker.state.quickRanges).toBe(quickRanges);
    expect(timeRange.state.from).toBe('now-2h');
    expect(timeRange.state.to).toBe('now');
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe(historyAfterOpen);
    expect(localStorage.getItem(PERSONAL_TIME_RANGES_STORAGE_KEY)).toBe('[]');
  });

  it('shows a range saved on one dashboard in the time picker of another', async () => {
    const user = userEvent.setup();
    const quickRanges: TimeOption[] = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];
    const first = buildDashboard({ uid: 'dash-a', from: 'now-2h', to: 'now', quickRanges });
    const firstView = renderInGrafanaContext(<first.controls.Component model={first.controls} />);

    await openTimePicker(user);
    await user.click(screen.getByRole('button', { name: 'Save current range' }));
    expect(first.timePicker.state.quickRanges).toBe(quickRanges);
    firstView.unmount();

    const second = buildDashboard({ uid: 'dash-b', from: 'now-5m', to: 'now' });
    renderInGrafanaContext(<second.controls.Component model={second.controls} />);
    await openTimePicker(user);

    const yours = screen.getByRole('region', { name: 'Your ranges' });
    const quick = screen.getByRole('region', { name: 'Quick ranges' });
    expect(within(yours).getByRole('button', { name: 'Last 2 hours' })).toBeInTheDocument();
    expect(within(quick).getByText('Last 5 minutes')).toBeInTheDocument();
    expect(second.timePicker.state.quickRanges).toBeUndefined();
    expect(first.timePicker.state.quickRanges).toBe(quickRanges);
  });
});

async function openTimePicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId(selectors.components.TimePicker.openButton));
  expect(await screen.findByRole('region', { name: 'Your ranges' })).toBeInTheDocument();
}

function renderInGrafanaContext(child: ReactNode) {
  return render(
    <OpenFeatureProvider client={getTestFeatureFlagClient()}>
      <GrafanaContext.Provider value={getGrafanaContextMock()}>{child}</GrafanaContext.Provider>
    </OpenFeatureProvider>
  );
}

function buildDashboard(options: { uid: string; from: string; to: string; quickRanges?: TimeOption[] }) {
  const timePicker = new SceneTimePicker(options.quickRanges ? { quickRanges: options.quickRanges } : {});
  const timeRange = new SceneTimeRange({ from: options.from, to: options.to });
  const dashboard = new DashboardScene({
    uid: options.uid,
    $timeRange: timeRange,
    controls: new DashboardControls({ timePicker }),
  });
  dashboard.activate();
  return {
    dashboard,
    controls: dashboard.state.controls as DashboardControls,
    timePicker,
    timeRange,
  };
}
