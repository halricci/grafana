import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getDefaultTimeRange, systemDateFormats } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY, QuickRangesSourceContext } from '@grafana/ui/internal';

import { TimePickerWithHistory } from './TimePickerWithHistory';

describe('TimePickerWithHistory', () => {
  // In some of the tests we close and re-open the picker. When we do that we must re-find these inputs
  // as new elements will have been mounted
  const getFromField = () => screen.getByLabelText('From');
  const getToField = () => screen.getByLabelText('To');
  const getApplyButton = () => screen.getByRole('button', { name: 'Apply time range' });

  const LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';

  const NEW_LOCAL_STORAGE = [
    { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' },
    { from: '2022-12-02T00:00:00.000Z', to: '2022-12-02T23:59:59.000Z' },
  ];

  const props = {
    timeZone: 'utc',
    onChange: () => {},
    onChangeTimeZone: () => {},
    onMoveBackward: () => {},
    onMoveForward: () => {},
    onZoom: () => {},
  };

  afterEach(() => {
    window.localStorage.clear();
  });

  it('Should load with no history', async () => {
    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    expect(screen.getByText(/It looks like you haven't used this time picker before/i)).toBeInTheDocument();
  });

  it('Should load with valid time picker history only', async () => {
    // TimePickerWithHistory only accepts TimePickerHistoryItem objects, invalid history items should be ignored
    const BAD_LOCAL_STORAGE = [
      { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }, // valid
      {
        from: '2022-12-01T00:00:00.000Z',
        to: '2022-12-01T23:59:59.000Z',
        raw: { from: '2022-12-01T00:00:00.000Z', to: '022-12-01T23:59:59.000Z' }, // Invalid, because it has raw property which doesn't match TimePickerHistoryItem
      },
      {}, // Invalid, because empty
      { from: null, to: null }, // Invalid, because both value are null
      { from: '2022-12-04T00:00:00.000Z', to: null }, // Invalid because one value is null
    ];
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(BAD_LOCAL_STORAGE));

    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    expect(screen.getByText(/2022-12-03 00:00:00 to 2022-12-03 23:59:59/i)).toBeInTheDocument();
    expect(screen.queryByText(/2022-12-01 00:00:00 to 2022-12-01 23:59:59/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2022-12-04 00:00:00 to 2022-12-04 23:59:59/i)).not.toBeInTheDocument();
  });

  it('Should load with new TimePickerHistoryItem history', async () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(NEW_LOCAL_STORAGE));

    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    expect(screen.queryByText(/2022-12-03 00:00:00 to 2022-12-03 23:59:59/i)).toBeInTheDocument();
    expect(screen.queryByText(/2022-12-02 00:00:00 to 2022-12-02 23:59:59/i)).toBeInTheDocument();
  });

  it('Saves changes into local storage without duplicates', async () => {
    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    await clearAndType(getFromField(), '2022-12-03 00:00:00');
    await clearAndType(getToField(), '2022-12-03 23:59:59');
    await userEvent.click(getApplyButton());

    await userEvent.click(screen.getByLabelText(/Time range selected/));

    // Same range again!
    await clearAndType(getFromField(), '2022-12-03 00:00:00');
    await clearAndType(getToField(), '2022-12-03 23:59:59');
    await userEvent.click(getApplyButton());

    const newLsValue = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]');
    expect(newLsValue).toEqual([{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }]);
  });

  it('Should show 4 most recently used time ranges', async () => {
    const inputRanges: Array<[string, string]> = [
      ['2022-12-10 00:00:00', '2022-12-10 23:59:59'],
      ['2022-12-11 00:00:00', '2022-12-11 23:59:59'],
      ['2022-12-12 00:00:00', '2022-12-12 23:59:59'],
      ['2022-12-13 00:00:00', '2022-12-13 23:59:59'],
      ['2022-12-14 00:00:00', '2022-12-14 23:59:59'],
    ];

    const expectedLocalStorage = [
      { from: '2022-12-14T00:00:00.000Z', to: '2022-12-14T23:59:59.000Z' },
      { from: '2022-12-13T00:00:00.000Z', to: '2022-12-13T23:59:59.000Z' },
      { from: '2022-12-12T00:00:00.000Z', to: '2022-12-12T23:59:59.000Z' },
      { from: '2022-12-11T00:00:00.000Z', to: '2022-12-11T23:59:59.000Z' },
    ];

    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} />);

    for (const [inputFrom, inputTo] of inputRanges) {
      await userEvent.click(screen.getByLabelText(/Time range selected/));
      await clearAndType(getFromField(), inputFrom);
      await clearAndType(getToField(), inputTo);

      await userEvent.click(getApplyButton());
    }

    const newLsValue = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]');
    expect(newLsValue).toEqual(expectedLocalStorage);
  });

  it('Should display handle timezones correctly', async () => {
    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} {...{ timeZone: 'Asia/Tokyo' }} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    await clearAndType(getFromField(), '2022-12-10 00:00:00');
    await clearAndType(getToField(), '2022-12-10 23:59:59');
    await userEvent.click(getApplyButton());

    await userEvent.click(screen.getByLabelText(/Time range selected/));

    expect(screen.getByText(/2022-12-10 00:00:00 to 2022-12-10 23:59:59/i)).toBeInTheDocument();
  });

  it('saves and removes a personal range without touching recently used ranges', async () => {
    const onChange = jest.fn();
    const timeRange = getDefaultTimeRange();
    render(<TimePickerWithHistory value={timeRange} {...props} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    await userEvent.click(screen.getByTestId(selectors.components.TimePicker.savePersonalRangeButton));

    expect(onChange).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ]);

    const personal = screen.getByTestId(selectors.components.TimePicker.personalRanges);
    expect(within(personal).getByText('Last 6 hours')).toBeInTheDocument();
    expect(screen.getByTestId(selectors.components.TimePicker.quickRanges)).toBeInTheDocument();

    await clearAndType(getFromField(), '2022-12-03 00:00:00');
    await clearAndType(getToField(), '2022-12-03 23:59:59');
    await userEvent.click(getApplyButton());

    expect(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]')).toEqual([
      { from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' },
    ]);
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ]);

    await userEvent.click(screen.getByLabelText(/Time range selected/));
    await userEvent.click(
      within(screen.getByTestId(selectors.components.TimePicker.personalRanges)).getByRole('button', {
        name: 'Remove Last 6 hours',
      })
    );

    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
    expect(screen.getByText(/2022-12-03 00:00:00 to 2022-12-03 23:59:59/i)).toBeInTheDocument();
  });

  it('labels dashboard ranges and leaves them in place when a personal range is saved', async () => {
    const onChange = jest.fn();
    const timeRange = getDefaultTimeRange();
    render(
      <QuickRangesSourceContext.Provider value="dashboard">
        <TimePickerWithHistory
          value={timeRange}
          {...props}
          onChange={onChange}
          quickRanges={[{ from: 'now-1h', to: 'now', display: 'Business hours' }]}
        />
      </QuickRangesSourceContext.Provider>
    );
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    const dashboard = screen.getByTestId(selectors.components.TimePicker.dashboardRanges);
    expect(within(dashboard).getByText('Business hours')).toBeInTheDocument();
    expect(within(dashboard).queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId(selectors.components.TimePicker.savePersonalRangeButton));

    expect(onChange).not.toHaveBeenCalled();
    expect(within(dashboard).getByText('Business hours')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
      { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
    ]);
  });

  it('Should display history correctly with custom time format', async () => {
    const timeRange = getDefaultTimeRange();

    const interval = {
      millisecond: 'HH:mm:ss.SSS',
      second: 'HH:mm:ss',
      minute: 'HH:mm',
      hour: 'DD-MM HH:mm',
      day: 'DD-MM',
      month: 'MM-YYYY',
      year: 'YYYY',
    };

    systemDateFormats.update({
      fullDate: 'DD-MM-YYYY HH:mm:ss',
      interval: interval,
      useBrowserLocale: false,
    });
    render(<TimePickerWithHistory value={timeRange} {...props} />);
    await userEvent.click(screen.getByLabelText(/Time range selected/));

    await clearAndType(getFromField(), '03-12-2022 00:00:00');
    await clearAndType(getToField(), '03-12-2022 23:59:59');
    await userEvent.click(getApplyButton());

    await userEvent.click(screen.getByLabelText(/Time range selected/));

    expect(screen.getByText(/03-12-2022 00:00:00 to 03-12-2022 23:59:59/i)).toBeInTheDocument();
  });
});

async function clearAndType(field: HTMLElement, text: string) {
  await userEvent.clear(field);
  return await userEvent.type(field, text);
}
