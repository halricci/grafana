import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '@grafana/ui';

import { TimePickerSettings } from './TimePickerSettings';

describe('TimePickerSettings personal quick ranges', () => {
  const callbacks = {
    onWeekStartChange: jest.fn(),
    onTimeZoneChange: jest.fn(),
    onRefreshIntervalChange: jest.fn(),
    onNowDelayChange: jest.fn(),
    onHideTimePickerChange: jest.fn(),
    onLiveNowChange: jest.fn(),
  };

  afterEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  function renderSettings() {
    return render(<TimePickerSettings timezone="utc" {...callbacks} />);
  }

  it('adds a personal range without notifying dashboard settings', async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(
      screen.getByText(
        'Saved in this browser and shown in every dashboard time picker. Adding or removing one does not change this dashboard.'
      )
    ).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Quick range from' }), 'now-15m');
    await user.type(screen.getByRole('textbox', { name: 'Quick range to' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Add range' }));

    expect(screen.getByText('Last 15 minutes')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { display: 'Last 15 minutes', from: 'now-15m', to: 'now' },
    ]);
    expect(callbacks.onTimeZoneChange).not.toHaveBeenCalled();
    expect(callbacks.onRefreshIntervalChange).not.toHaveBeenCalled();
    expect(callbacks.onNowDelayChange).not.toHaveBeenCalled();
    expect(callbacks.onHideTimePickerChange).not.toHaveBeenCalled();
    expect(callbacks.onLiveNowChange).not.toHaveBeenCalled();
    expect(callbacks.onWeekStartChange).not.toHaveBeenCalled();
  });

  it('does not store an invalid range', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByRole('textbox', { name: 'Quick range from' }), 'nope');
    await user.type(screen.getByRole('textbox', { name: 'Quick range to' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Add range' }));

    expect(screen.getByText('Enter a date or a relative time such as now-1h.')).toBeInTheDocument();
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
    expect(callbacks.onTimeZoneChange).not.toHaveBeenCalled();
  });

  it('removes a personal range without notifying dashboard settings', async () => {
    window.localStorage.setItem(
      PERSONAL_QUICK_RANGES_STORAGE_KEY,
      JSON.stringify([{ display: 'Last 1 hour', from: 'now-1h', to: 'now' }])
    );
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Remove Last 1 hour' }));

    expect(screen.queryByText('Last 1 hour')).not.toBeInTheDocument();
    expect(screen.getByText('No saved ranges yet.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(callbacks.onHideTimePickerChange).not.toHaveBeenCalled();
  });
});
