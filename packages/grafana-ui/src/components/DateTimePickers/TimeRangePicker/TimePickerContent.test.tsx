import { render, type RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, type TimeRange } from '@grafana/data';

import { type QuickRangeSource } from './QuickRangeSections';
import { type PropsWithScreenSize, TimePickerContentWithScreenSize } from './TimePickerContent';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from './personalQuickRanges';

describe('TimePickerContent', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

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

    it('keeps personal ranges separate from dashboard ranges and recent history', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({
        value: relativeValue,
        history,
        onChange,
        quickRangeSource: 'dashboard',
      });

      expect(screen.getByRole('heading', { name: 'Your ranges' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Quick ranges' })).not.toBeInTheDocument();
      expect(screen.getByText('Saved in this browser')).toBeInTheDocument();
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Save current range' }));

      const yours = screen.getByRole('region', { name: 'Your ranges' });
      expect(within(yours).getByText('Last 5 minutes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Saved to your ranges' })).toBeDisabled();
      expect(onChange).not.toHaveBeenCalled();
      expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
        { display: 'Last 5 minutes', from: 'now-5m', to: 'now' },
      ]);
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();

      const dashboard = screen.getByRole('region', { name: 'Dashboard' });
      expect(within(dashboard).queryByRole('button', { name: 'Remove Last 5 minutes' })).not.toBeInTheDocument();

      await user.click(within(yours).getByRole('button', { name: 'Remove Last 5 minutes' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(within(yours).queryByText('Last 5 minutes')).not.toBeInTheDocument();
      expect(within(dashboard).getByText('Last 5 minutes')).toBeInTheDocument();
      expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([]);
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
    });

    it('labels built-in ranges as quick ranges and reloads saved ranges', () => {
      window.localStorage.setItem(
        PERSONAL_QUICK_RANGES_STORAGE_KEY,
        JSON.stringify([{ display: 'Last 12 hours', from: 'now-12h', to: 'now' }])
      );

      const { unmount } = renderComponent({ value: relativeValue });
      const yours = screen.getByRole('region', { name: 'Your ranges' });
      expect(screen.getByRole('heading', { name: 'Quick ranges' })).toBeInTheDocument();
      expect(within(yours).getByText('Last 12 hours')).toBeInTheDocument();

      unmount();
      renderComponent({ value: relativeValue });
      expect(
        within(screen.getByRole('region', { name: 'Your ranges' })).getByText('Last 12 hours')
      ).toBeInTheDocument();
    });

    it('shows an empty dashboard list without falling back to built-in ranges', () => {
      renderComponent({ value: relativeValue, quickOptions: [], quickRangeSource: 'dashboard' });

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByText('This dashboard has no quick ranges.')).toBeInTheDocument();
      expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
    });

    it('still applies a dashboard range', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({ value: relativeValue, onChange, quickRangeSource: 'dashboard' });

      await user.click(screen.getByRole('checkbox', { name: 'Last 15 minutes' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].raw).toEqual({ from: 'now-15m', to: 'now' });
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
  onChange = noop,
  quickRangeSource = 'builtin',
  quickOptions = [
    { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
    { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
  ],
}: Pick<PropsWithScreenSize, 'value'> &
  Partial<PropsWithScreenSize> & { quickRangeSource?: QuickRangeSource }): RenderResult {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={onChange}
      quickOptions={quickOptions}
      quickRangeSource={quickRangeSource}
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
