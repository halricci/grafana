import { render, type RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { dateTime, type TimeRange } from '@grafana/data';

import { type PropsWithScreenSize, TimePickerContentWithScreenSize } from './TimePickerContent';
import { PERSONAL_QUICK_RANGES_STORAGE_KEY } from './personalQuickRanges';

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

  describe('Personal quick ranges', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    const morning = { from: 'now-2h', to: 'now', display: 'Morning standup' };

    it('labels personal ranges and dashboard ranges separately', async () => {
      renderComponent({
        value: relativeValue,
        personalQuickRanges: [morning],
      });

      expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent(
        'Saved in this browser, not on the dashboard.'
      );
      expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Come from this dashboard.');
      expect(screen.getByText('Morning standup')).toBeInTheDocument();
      expect(screen.getByText('Last 5 minutes')).toBeInTheDocument();
    });

    it('saves a dashboard range without applying it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onSavePersonalQuickRange = jest.fn();
      renderComponent({
        value: relativeValue,
        onChange,
        personalQuickRanges: [],
        onSavePersonalQuickRange,
      });

      await user.click(screen.getByRole('button', { name: 'Save Last 5 minutes to your ranges' }));

      expect(onSavePersonalQuickRange).toHaveBeenCalledWith({
        from: 'now-5m',
        to: 'now',
        display: 'Last 5 minutes',
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('saves the current relative range without applying a new one', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onSavePersonalQuickRange = jest.fn();
      renderComponent({
        value: createRelativeTimeRange(),
        onChange,
        personalQuickRanges: [],
        onSavePersonalQuickRange,
      });

      await user.click(screen.getByRole('button', { name: 'Save current range' }));

      expect(onSavePersonalQuickRange).toHaveBeenCalledWith({
        from: 'now-5m',
        to: 'now',
        display: 'Last 5 minutes',
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('removes a personal range without applying it or dropping recent ranges', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onRemovePersonalQuickRange = jest.fn();
      renderComponent({
        value: absoluteValue,
        history,
        onChange,
        personalQuickRanges: [morning],
        onRemovePersonalQuickRange,
      });

      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Remove Morning standup from your ranges' }));

      expect(onRemovePersonalQuickRange).toHaveBeenCalledWith(morning);
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/2019-12-17 07:48:27 to 2019-12-17 07:49:27/i)).toBeInTheDocument();
      expect(screen.getByText(/recently used absolute ranges/i)).toBeInTheDocument();
    });

    it('saves and removes a range in browser storage without applying it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const history = [{ from: '2022-12-03T00:00:00.000Z', to: '2022-12-03T23:59:59.000Z' }];
      window.localStorage.setItem('grafana.dashboard.timepicker.history', JSON.stringify(history));
      window.localStorage.setItem(
        PERSONAL_QUICK_RANGES_STORAGE_KEY,
        JSON.stringify([{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }])
      );

      const view = renderComponent({
        value: relativeValue,
        onChange,
        personalQuickRanges: undefined,
      });

      expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent('Last 6 hours');

      await user.click(screen.getByRole('button', { name: 'Save Last 15 minutes to your ranges' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getAllByText('Last 15 minutes')).toHaveLength(2);
      expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
        { from: 'now-6h', to: 'now', display: 'Last 6 hours' },
      ]);
      expect(JSON.parse(window.localStorage.getItem('grafana.dashboard.timepicker.history') ?? '[]')).toEqual(history);

      view.unmount();
      renderComponent({ value: relativeValue, onChange, personalQuickRanges: undefined });
      expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent('Last 15 minutes');
      expect(screen.getByRole('region', { name: 'Your ranges' })).toHaveTextContent('Last 6 hours');

      await user.click(screen.getByRole('button', { name: 'Remove Last 6 hours from your ranges' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByText('Last 6 hours')).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Dashboard ranges' })).toHaveTextContent('Last 15 minutes');
      expect(JSON.parse(window.localStorage.getItem(PERSONAL_QUICK_RANGES_STORAGE_KEY) ?? '[]')).toEqual([
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
      ]);
      expect(JSON.parse(window.localStorage.getItem('grafana.dashboard.timepicker.history') ?? '[]')).toEqual(history);
    });

    it('applies a personal range when the range itself is chosen', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({
        value: relativeValue,
        onChange,
        personalQuickRanges: [morning],
        onSavePersonalQuickRange: jest.fn(),
        onRemovePersonalQuickRange: jest.fn(),
      });

      await user.click(screen.getByText('Morning standup'));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ raw: { from: 'now-2h', to: 'now' } }));
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
  ...rest
}: Pick<PropsWithScreenSize, 'value'> & Partial<PropsWithScreenSize>): RenderResult {
  return render(
    <TimePickerContentWithScreenSize
      onChangeTimeZone={noop}
      onChange={noop}
      quickOptions={[
        { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
        { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
      ]}
      personalQuickRanges={[]}
      timeZone="utc"
      value={value}
      isFullscreen={isFullscreen}
      showHistory={showHistory}
      history={history}
      hideQuickRanges={hideQuickRanges}
      hideTimeZone={hideTimeZone}
      {...rest}
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
