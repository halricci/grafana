import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimePickerSettings } from './TimePickerSettings';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from './personalQuickRanges';

describe('TimePickerSettings personal ranges', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('adds and removes personal ranges without changing dashboard time settings', async () => {
    const user = userEvent.setup();
    const handlers = {
      onWeekStartChange: jest.fn(),
      onTimeZoneChange: jest.fn(),
      onRefreshIntervalChange: jest.fn(),
      onNowDelayChange: jest.fn(),
      onHideTimePickerChange: jest.fn(),
      onLiveNowChange: jest.fn(),
    };

    render(<TimePickerSettings {...handlers} timezone="utc" />);

    await user.type(screen.getByRole('textbox', { name: 'Range name' }), 'My workday');
    await user.type(screen.getByRole('textbox', { name: 'From' }), 'now-8h');
    await user.type(screen.getByRole('textbox', { name: 'To' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Add range' }));

    expect(screen.getByText('My workday (now-8h – now)')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-8h', to: 'now', display: 'My workday' },
    ]);
    expect(Object.values(handlers).every((handler) => handler.mock.calls.length === 0)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Remove My workday' }));

    expect(screen.queryByText('My workday (now-8h – now)')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(Object.values(handlers).every((handler) => handler.mock.calls.length === 0)).toBe(true);
  });
});
