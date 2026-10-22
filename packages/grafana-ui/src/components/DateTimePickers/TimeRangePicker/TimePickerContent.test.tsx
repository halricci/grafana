import { render, type RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, type TimeOption, type TimeRange } from '@grafana/data';

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

  describe('personal and dashboard ranges', () => {
    const personal: TimeOption[] = [{ from: 'now-12h', to: 'now', display: 'Last 12 hours' }];
    const dashboard: TimeOption[] = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];

    it('labels the user list and the dashboard list, and still shows recently used absolute ranges', async () => {
      renderComponent({
        value: absoluteValue,
        history,
        personalQuickRanges: personal,
        dashboardQuickRanges: dashboard,
      });

      expect(await screen.findByRole('region', { name: 'Your ranges' })).toHaveTextContent('Last 12 hours');
      expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Last 6 hours');
      expect(screen.getByRole('region', { name: 'Quick ranges' })).toHaveTextContent('Last 5 minutes');
      expect(screen.getByText(/recently used absolute ranges/i)).toBeInTheDocument();
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save to your ranges' })).not.toBeInTheDocument();
    });

    it('saves the current relative range without applying it or duplicating a dashboard list', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onPersonalQuickRangesChange = jest.fn();
      renderComponent({
        value: createRelativeTimeRange(),
        quickOptions: dashboard,
        dashboardQuickRanges: dashboard,
        onChange,
        onPersonalQuickRangesChange,
      });

      expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Last 6 hours');
      expect(screen.getAllByText('Last 6 hours')).toHaveLength(1);
      expect(screen.queryByRole('region', { name: 'Quick ranges' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Save to your ranges' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(onPersonalQuickRangesChange).toHaveBeenCalledWith([
        { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
      ]);
    });

    it('removes a personal range without selecting it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onPersonalQuickRangesChange = jest.fn();
      renderComponent({
        value: absoluteValue,
        personalQuickRanges: personal,
        dashboardQuickRanges: dashboard,
        onChange,
        onPersonalQuickRangesChange,
      });

      await user.click(screen.getByRole('button', { name: 'Remove Last 12 hours from your ranges' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(onPersonalQuickRangesChange).toHaveBeenCalledWith([]);
    });

    it('selects a personal range', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({
        value: absoluteValue,
        personalQuickRanges: personal,
        onPersonalQuickRangesChange: jest.fn(),
        onChange,
      });

      await user.click(screen.getByText('Last 12 hours'));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ raw: { from: 'now-12h', to: 'now' } }));
    });

    it('filters personal and dashboard ranges by the search text', async () => {
      const user = userEvent.setup();
      renderComponent({
        value: absoluteValue,
        personalQuickRanges: personal,
        dashboardQuickRanges: dashboard,
      });

      await user.type(screen.getByPlaceholderText(/search quick ranges/i), '12 hours');

      expect(screen.getByText('Last 12 hours')).toBeInTheDocument();
      expect(screen.queryByText('Last 6 hours')).not.toBeInTheDocument();
      expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
    });
  });
});

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
  quickOptions = [
    { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
    { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
  ],
  personalQuickRanges,
  onPersonalQuickRangesChange,
  dashboardQuickRanges,
  onChange = noop,
}: Pick<PropsWithScreenSize, 'value'> & Partial<PropsWithScreenSize>): RenderResult {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={onChange}
      quickOptions={quickOptions}
      personalQuickRanges={personalQuickRanges}
      onPersonalQuickRangesChange={onPersonalQuickRangesChange}
      dashboardQuickRanges={dashboardQuickRanges}
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
