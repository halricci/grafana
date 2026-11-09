import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { store } from '@grafana/data';
import { PERSONAL_QUICK_RANGES_KEY } from '@grafana/ui';

import { TimePickerSettings } from './TimePickerSettings';

describe('TimePickerSettings', () => {
  const onWeekStartChange = jest.fn();
  const onTimeZoneChange = jest.fn();
  const onRefreshIntervalChange = jest.fn();
  const onNowDelayChange = jest.fn();
  const onHideTimePickerChange = jest.fn();
  const onLiveNowChange = jest.fn();

  const dashboardCallbacks = [
    onWeekStartChange,
    onTimeZoneChange,
    onRefreshIntervalChange,
    onNowDelayChange,
    onHideTimePickerChange,
    onLiveNowChange,
  ];

  beforeEach(() => {
    store.delete(PERSONAL_QUICK_RANGES_KEY);
    dashboardCallbacks.forEach((callback) => callback.mockClear());
  });

  function renderSettings() {
    return render(
      <TimePickerSettings
        timezone="utc"
        onWeekStartChange={onWeekStartChange}
        onTimeZoneChange={onTimeZoneChange}
        onRefreshIntervalChange={onRefreshIntervalChange}
        onNowDelayChange={onNowDelayChange}
        onHideTimePickerChange={onHideTimePickerChange}
        onLiveNowChange={onLiveNowChange}
      />
    );
  }

  it('saves a personal range without changing dashboard time settings', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSettings();

    expect(screen.getByText(/does not change the dashboard/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'Deploy window');
    await user.type(screen.getByLabelText('From'), 'now-1h');
    await user.click(screen.getByRole('button', { name: 'Add range' }));

    expect(screen.getByText('Deploy window (now-1h to now)')).toBeInTheDocument();
    expect(store.getObject(PERSONAL_QUICK_RANGES_KEY)).toEqual([
      { display: 'Deploy window', from: 'now-1h', to: 'now' },
    ]);
    dashboardCallbacks.forEach((callback) => expect(callback).not.toHaveBeenCalled());

    unmount();
    renderSettings();

    expect(screen.getByText('Deploy window (now-1h to now)')).toBeInTheDocument();
  });

  it('does not save an unparseable range', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText('Name'), 'Bad');
    await user.type(screen.getByLabelText('From'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Add range' }));

    expect(screen.getByText('Enter a time like now-1h or a date')).toBeInTheDocument();
    expect(store.getObject(PERSONAL_QUICK_RANGES_KEY, [])).toEqual([]);
    dashboardCallbacks.forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });

  it('removes a personal range without changing dashboard time settings', async () => {
    const user = userEvent.setup();
    store.setObject(PERSONAL_QUICK_RANGES_KEY, [{ display: 'Deploy window', from: 'now-1h', to: 'now' }]);
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Remove Deploy window' }));

    expect(screen.queryByText('Deploy window (now-1h to now)')).not.toBeInTheDocument();
    expect(screen.getByText('No quick ranges saved yet.')).toBeInTheDocument();
    expect(store.getObject(PERSONAL_QUICK_RANGES_KEY)).toEqual([]);
    dashboardCallbacks.forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });
});
