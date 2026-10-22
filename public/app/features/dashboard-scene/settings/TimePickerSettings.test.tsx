import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from 'app/core/components/TimePicker/personalQuickRanges';

import { TimePickerSettings } from './TimePickerSettings';

describe('TimePickerSettings personal quick ranges', () => {
  const onWeekStartChange = jest.fn();
  const onTimeZoneChange = jest.fn();
  const onRefreshIntervalChange = jest.fn();
  const onNowDelayChange = jest.fn();
  const onHideTimePickerChange = jest.fn();
  const onLiveNowChange = jest.fn();

  function renderSettings() {
    return render(
      <TimePickerSettings
        onWeekStartChange={onWeekStartChange}
        onTimeZoneChange={onTimeZoneChange}
        onRefreshIntervalChange={onRefreshIntervalChange}
        onNowDelayChange={onNowDelayChange}
        onHideTimePickerChange={onHideTimePickerChange}
        onLiveNowChange={onLiveNowChange}
        timezone="utc"
      />
    );
  }

  afterEach(() => {
    window.localStorage.clear();
  });

  it('adds and removes a personal range without calling dashboard setting callbacks', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByRole('textbox', { name: 'From' }), '45m');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Last 45 minutes (now-45m to now)')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([
      { from: 'now-45m', to: 'now', display: 'Last 45 minutes' },
    ]);
    expect(onWeekStartChange).not.toHaveBeenCalled();
    expect(onTimeZoneChange).not.toHaveBeenCalled();
    expect(onRefreshIntervalChange).not.toHaveBeenCalled();
    expect(onNowDelayChange).not.toHaveBeenCalled();
    expect(onHideTimePickerChange).not.toHaveBeenCalled();
    expect(onLiveNowChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Remove Last 45 minutes' }));

    expect(screen.getByText('No saved ranges yet.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([]);
    expect(onNowDelayChange).not.toHaveBeenCalled();
  });

  it('does not store an invalid range', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByRole('textbox', { name: 'From' }), 'yesterday-ish');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a relative range, like 45m or now-45m to now.');
    expect(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });
});
