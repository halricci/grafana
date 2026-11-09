import { render, type RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, type TimeOption, type TimeRange } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { type PropsWithScreenSize, TimePickerContentWithScreenSize } from './TimePickerContent';

describe('TimePickerContent', () => {
  const absoluteValue = createAbsoluteTimeRange('2019-12-17T07:48:27.433Z', '2019-12-18T07:49:27.433Z');
  const relativeValue = createRelativeTimeRange();
  const history = [
    createAbsoluteTimeRange('2019-12-17T07:48:27.433Z', '2019-12-17T07:49:27.433Z'),
    createAbsoluteTimeRange('2019-10-18T07:50:27.433Z', '2019-10-18T07:51:27.433Z'),
  ];

  describe('Wide Screen', () => {
    it('renders with history', async () => {
      renderComponent({ value: absoluteValue, history });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(await screen.findByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).toBeInTheDocument();
    });

    it('renders with empty history', async () => {
      renderComponent({ value: absoluteValue });
      expect(
        await screen.findByText(
          /it looks like you haven't used this time picker before\. as soon as you enter some time intervals, recently used intervals will appear here\./i
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
    });

    it('renders without history', async () => {
      renderComponent({ value: absoluteValue, history, showHistory: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).not.toBeInTheDocument();
    });

    it('renders with relative picker', async () => {
      renderComponent({ value: absoluteValue });
      expect(await screen.findByText(/Last 5 minutes/i)).toBeInTheDocument();
    });

    it('renders without relative picker', async () => {
      renderComponent({ value: absoluteValue, hideQuickRanges: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('renders with timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.getByText(/coordinated universal time/i)).toBeInTheDocument();
    });

    it('renders without timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/coordinated universal time/i)).not.toBeInTheDocument();
    });
  });

  describe('Narrow Screen', () => {
    it('renders with history', async () => {
      renderComponent({ value: absoluteValue, history, isFullscreen: false });
      expect(await screen.findByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(await screen.findByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).toBeInTheDocument();
    });

    it('renders with empty history', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          /it looks like you haven't used this time picker before\. as soon as you enter some time intervals, recently used intervals will appear here\./i
        )
      ).not.toBeInTheDocument();
    });

    it('renders without history', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, history, showHistory: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/recently used absolute ranges/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2019-10-18 07:50:27 to 2019-10-18 07:51:27/i)).not.toBeInTheDocument();
    });

    it('renders with relative picker', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByText(/Last 5 minutes/i)).toBeInTheDocument();
    });

    it('renders without relative picker', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('renders with absolute picker when absolute value and quick ranges are visible', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders with absolute picker when absolute value and quick ranges are hidden', async () => {
      renderComponent({ value: absoluteValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders without absolute picker when narrow screen and quick ranges are visible', async () => {
      renderComponent({ value: relativeValue, isFullscreen: false });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    });

    it('renders with absolute picker when narrow screen and quick ranges are hidden', async () => {
      renderComponent({ value: relativeValue, isFullscreen: false, hideQuickRanges: true });
      expect(await screen.findByLabelText('From')).toBeInTheDocument();
    });

    it('renders without timezone picker', async () => {
      renderComponent({ value: absoluteValue, hideTimeZone: true });
      expect(await screen.findByText(/absolute time range/i)).toBeInTheDocument();
      expect(screen.queryByText(/coordinated universal time/i)).not.toBeInTheDocument();
    });
  });

  describe('Time Shortcut Parsing', () => {
    it('shows custom time option when typing a valid time shortcut', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '30m');

      expect(screen.getByText('Last 30 minutes')).toBeInTheDocument();
    });

    it('does not show custom time option for compound durations', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '1h30m');

      expect(screen.queryByText(/Last 1 hour 30 minutes/i)).not.toBeInTheDocument();
    });

    it('uses singular form for single units', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '1h');

      expect(screen.getByText('Last 1 hour')).toBeInTheDocument();
    });

    it('does not show duplicate options if custom shortcut matches existing option', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '5m');

      const options = screen.getAllByText(/Last 5 minutes/i);
      expect(options).toHaveLength(1);
    });

    it('filters existing options while showing custom shortcut', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, '45m');

      expect(screen.getByText('Last 45 minutes')).toBeInTheDocument();
      expect(screen.queryByText(/Last 5 minutes/i)).not.toBeInTheDocument();
    });

    it('does not show custom option for invalid time shortcuts', async () => {
      const user = userEvent.setup();
      renderComponent({ value: relativeValue });

      const searchInput = screen.getByPlaceholderText(/search quick ranges/i);
      await user.type(searchInput, 'invalid');

      expect(screen.queryByText(/Last invalid/i)).not.toBeInTheDocument();
    });
  });
});

describe('personal and dashboard quick ranges', () => {
  const timePicker = selectors.components.TimePicker;
  const dashboardRanges: TimeOption[] = [{ display: 'Last 6 hours', from: 'now-6h', to: 'now' }];
  const personalRanges: TimeOption[] = [{ display: 'Deploy window', from: 'now-2h', to: 'now' }];

  it('labels personal ranges and dashboard ranges separately', () => {
    renderRanges({
      onChangePersonalQuickRanges: jest.fn(),
      personalQuickRanges: personalRanges,
      quickOptions: dashboardRanges,
      quickOptionsTitle: 'Dashboard',
    });

    expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent('Deploy window');
    expect(screen.getByTestId(timePicker.dashboardRanges)).toHaveTextContent('Last 6 hours');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('saves the current range without applying it', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onChangePersonalQuickRanges = jest.fn();
    renderRanges({
      onChange,
      onChangePersonalQuickRanges,
      quickOptions: dashboardRanges,
      quickOptionsTitle: 'Dashboard',
    });

    await user.click(screen.getByTestId(timePicker.savePersonalRangeButton));
    const name = screen.getByTestId(timePicker.personalRangeNameInput);
    await user.clear(name);
    await user.type(name, 'Deploy window');
    await user.click(screen.getByTestId(timePicker.confirmPersonalRangeButton));

    expect(onChange).not.toHaveBeenCalled();
    expect(onChangePersonalQuickRanges).toHaveBeenCalledWith([{ display: 'Deploy window', from: 'now-5m', to: 'now' }]);
    expect(screen.getByText('Last 6 hours')).toBeInTheDocument();
  });

  it('requires a name before saving', async () => {
    const user = userEvent.setup();
    const onChangePersonalQuickRanges = jest.fn();
    renderRanges({ onChangePersonalQuickRanges });

    await user.click(screen.getByTestId(timePicker.savePersonalRangeButton));
    await user.clear(screen.getByTestId(timePicker.personalRangeNameInput));
    await user.click(screen.getByTestId(timePicker.confirmPersonalRangeButton));

    expect(screen.getByText('Enter a name')).toBeInTheDocument();
    expect(onChangePersonalQuickRanges).not.toHaveBeenCalled();
  });

  it('removes a personal range without applying a time range', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onChangePersonalQuickRanges = jest.fn();
    renderRanges({
      onChange,
      onChangePersonalQuickRanges,
      personalQuickRanges: personalRanges,
      quickOptions: dashboardRanges,
      quickOptionsTitle: 'Dashboard',
    });

    await user.click(screen.getByRole('button', { name: 'Remove Deploy window' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(onChangePersonalQuickRanges).toHaveBeenCalledWith([]);
    expect(screen.getByText('Last 6 hours')).toBeInTheDocument();
  });

  it('keeps recently used absolute ranges available', () => {
    renderRanges({
      onChangePersonalQuickRanges: jest.fn(),
      personalQuickRanges: personalRanges,
      history: [createAbsoluteTimeRange('2019-12-17T07:48:27.433Z', '2019-12-17T07:49:27.433Z')],
    });

    expect(screen.getByText('Recently used absolute ranges')).toBeInTheDocument();
    expect(screen.getByText('2019-12-17 07:48:27 to 2019-12-17 07:49:27')).toBeInTheDocument();
  });

  it('filters personal ranges with the quick range search', async () => {
    const user = userEvent.setup();
    renderRanges({
      onChangePersonalQuickRanges: jest.fn(),
      personalQuickRanges: personalRanges,
      quickOptions: [{ from: 'now-5m', to: 'now', display: 'Last 5 minutes' }],
    });

    await user.type(screen.getByPlaceholderText(/search quick ranges/i), 'deploy');

    expect(screen.getByText('Deploy window')).toBeInTheDocument();
    expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
  });
});

function renderRanges(overrides: Partial<PropsWithScreenSize> = {}) {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={jest.fn()}
      quickOptions={[{ from: 'now-5m', to: 'now', display: 'Last 5 minutes' }]}
      timeZone="utc"
      value={createRelativeTimeRange()}
      isFullscreen
      showHistory
      history={[]}
      {...overrides}
    />
  );
}

function noop(): {} {
  return {};
}

function renderComponent({
  value,
  isFullscreen = true,
  showHistory = true,
  history = [],
  hideQuickRanges = false,
  hideTimeZone = false,
}: Pick<PropsWithScreenSize, 'value'> & Partial<PropsWithScreenSize>): RenderResult {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={noop}
      quickOptions={[
        { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
      ]}
      timeZone="utc"
      value={value}
      isFullscreen={isFullscreen}
      showHistory={showHistory}
      history={history}
      hideQuickRanges={hideQuickRanges}
      hideTimeZone={hideTimeZone}
    />
  );
}

function createRelativeTimeRange(): TimeRange {
  const now = dateTime();
  const now5m = now.subtract(5, 'm');

  return {
    from: now5m,
    to: now,
    raw: { from: 'now-5m', to: 'now' },
  };
}

function createAbsoluteTimeRange(from: string, to: string): TimeRange {
  return {
    from: dateTime(from),
    to: dateTime(to),
    raw: { from: dateTime(from), to: dateTime(to) },
  };
}
