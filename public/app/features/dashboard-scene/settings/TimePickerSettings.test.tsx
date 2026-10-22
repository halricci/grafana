import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { store } from '@grafana/data';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '@grafana/ui/internal';

import { TimePickerSettings } from './TimePickerSettings';

const HISTORY_KEY = 'grafana.dashboard.timepicker.history';

function renderSettings() {
  const props = {
    onWeekStartChange: jest.fn(),
    onTimeZoneChange: jest.fn(),
    onRefreshIntervalChange: jest.fn(),
    onNowDelayChange: jest.fn(),
    onHideTimePickerChange: jest.fn(),
    onLiveNowChange: jest.fn(),
    refreshIntervals: ['5s', '10s'],
    timePickerHidden: false,
    nowDelay: '',
    timezone: 'browser',
    weekStart: 'monday' as const,
    liveNow: false,
  };

  render(<TimePickerSettings {...props} />);
  return props;
}

describe('TimePickerSettings personal quick ranges', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves a personal range without changing dashboard time settings', async () => {
    const user = userEvent.setup();
    const history = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];
    store.setObject(HISTORY_KEY, history);
    const props = renderSettings();

    await user.type(screen.getByLabelText(/^Name/), 'Morning standup');
    await user.type(screen.getByLabelText('From'), 'now-2h');
    await user.type(screen.getByLabelText('To'), 'now');
    await user.click(screen.getByRole('button', { name: 'Add to your ranges' }));

    expect(screen.getByText('Morning standup')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-2h', to: 'now', display: 'Morning standup' },
    ]);
    expect(store.getObject(HISTORY_KEY)).toEqual(history);
    expect(props.onWeekStartChange).not.toHaveBeenCalled();
    expect(props.onTimeZoneChange).not.toHaveBeenCalled();
    expect(props.onRefreshIntervalChange).not.toHaveBeenCalled();
    expect(props.onNowDelayChange).not.toHaveBeenCalled();
    expect(props.onHideTimePickerChange).not.toHaveBeenCalled();
    expect(props.onLiveNowChange).not.toHaveBeenCalled();
  });

  it('removes a personal range without changing dashboard time settings', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ from: 'now-2h', to: 'now', display: 'Morning standup' }])
    );
    const props = renderSettings();

    await user.click(screen.getByRole('button', { name: 'Remove Morning standup from your ranges' }));

    expect(screen.queryByText('Morning standup')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(props.onHideTimePickerChange).not.toHaveBeenCalled();
    expect(props.onTimeZoneChange).not.toHaveBeenCalled();
  });

  it('rejects an absolute range and leaves storage empty', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText('From'), '2024-01-01');
    await user.type(screen.getByLabelText('To'), '2024-01-02');
    await user.click(screen.getByRole('button', { name: 'Add to your ranges' }));

    expect(screen.getByText('Enter a relative range such as now-6h to now.')).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });

  it('does not save the same range twice', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ from: 'now-5m', to: 'now', display: 'Last 5 minutes' }])
    );
    renderSettings();

    await user.type(screen.getByLabelText('From'), 'now-5m');
    await user.type(screen.getByLabelText('To'), 'now');
    await user.click(screen.getByRole('button', { name: 'Add to your ranges' }));

    expect(screen.getByText('This range is already in your ranges.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
    ]);
  });
});
