import userEvent from '@testing-library/user-event';
import { render, screen, within } from 'test/test-utils';

import { type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from '@grafana/ui';

import { TimePickerSettings } from './TimePickerSettings';

const settingsSelectors = selectors.pages.Dashboard.Settings.General;

describe('TimePickerSettings quick ranges', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves a dashboard range on the dashboard and a personal range in the browser', async () => {
    const onQuickRangesChange = jest.fn();
    render(<TimePickerSettings {...baseProps()} onQuickRangesChange={onQuickRangesChange} />);

    expect(screen.getByText('Dashboard ranges')).toBeInTheDocument();
    expect(screen.getByText('Your ranges')).toBeInTheDocument();
    expect(screen.getByText('Using the built-in quick ranges.')).toBeInTheDocument();

    await userEvent.type(screen.getByTestId(settingsSelectors.dashboardQuickRanges.fromInput), 'now-12h');
    await userEvent.type(screen.getByTestId(settingsSelectors.dashboardQuickRanges.toInput), 'now');
    await userEvent.type(screen.getByTestId(settingsSelectors.dashboardQuickRanges.nameInput), 'Half day');
    await userEvent.click(screen.getByTestId(settingsSelectors.dashboardQuickRanges.addButton));

    expect(onQuickRangesChange).toHaveBeenCalledWith([{ from: 'now-12h', to: 'now', display: 'Half day' }]);
    expect(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();

    onQuickRangesChange.mockClear();
    await userEvent.type(screen.getByTestId(settingsSelectors.personalQuickRanges.fromInput), 'now-6h');
    await userEvent.type(screen.getByTestId(settingsSelectors.personalQuickRanges.toInput), 'now');
    await userEvent.type(screen.getByTestId(settingsSelectors.personalQuickRanges.nameInput), 'Overnight');
    await userEvent.click(screen.getByTestId(settingsSelectors.personalQuickRanges.addButton));

    expect(onQuickRangesChange).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([
      { from: 'now-6h', to: 'now', display: 'Overnight' },
    ]);

    const personalRow = screen.getByTestId(settingsSelectors.personalQuickRanges.row('now-6h', 'now'));
    await userEvent.click(within(personalRow).getByRole('button', { name: 'Remove Overnight' }));

    expect(onQuickRangesChange).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? 'null')).toEqual([]);
  });

  it('removes a dashboard range without writing a personal range', async () => {
    const dashboardRange: TimeOption = { from: 'now-12h', to: 'now', display: 'Half day' };
    const onQuickRangesChange = jest.fn();
    render(
      <TimePickerSettings {...baseProps()} quickRanges={[dashboardRange]} onQuickRangesChange={onQuickRangesChange} />
    );

    const row = screen.getByTestId(settingsSelectors.dashboardQuickRanges.row('now-12h', 'now'));
    await userEvent.click(within(row).getByRole('button', { name: 'Remove Half day' }));

    expect(onQuickRangesChange).toHaveBeenCalledWith(undefined);
    expect(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });

  it('rejects an invalid personal range', async () => {
    const onQuickRangesChange = jest.fn();
    render(<TimePickerSettings {...baseProps()} onQuickRangesChange={onQuickRangesChange} />);

    await userEvent.type(screen.getByTestId(settingsSelectors.personalQuickRanges.fromInput), 'not a range');
    await userEvent.type(screen.getByTestId(settingsSelectors.personalQuickRanges.toInput), 'still not');
    await userEvent.click(screen.getByTestId(settingsSelectors.personalQuickRanges.addButton));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid from and to.');
    expect(onQuickRangesChange).not.toHaveBeenCalled();
    expect(localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY)).toBeNull();
  });
});

function baseProps() {
  return {
    onWeekStartChange: jest.fn(),
    onTimeZoneChange: jest.fn(),
    onRefreshIntervalChange: jest.fn(),
    onNowDelayChange: jest.fn(),
    onHideTimePickerChange: jest.fn(),
    onLiveNowChange: jest.fn(),
    onQuickRangesChange: jest.fn(),
    timezone: 'utc',
  };
}
