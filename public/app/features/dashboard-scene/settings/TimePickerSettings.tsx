import { isEmpty } from 'lodash';
import { type FormEvent, memo, useState } from 'react';

import { rangeUtil, type TimeOption, type TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import {
  Button,
  CollapsableSection,
  Field,
  IconButton,
  Input,
  Stack,
  Switch,
  TimeZonePicker,
  type WeekStart,
  WeekStartPicker,
} from '@grafana/ui';

import { AutoRefreshIntervals } from './AutoRefreshIntervals';
import { usePersonalQuickRanges } from './personalQuickRanges';

interface Props {
  onWeekStartChange: (weekStart?: WeekStart) => void;
  onTimeZoneChange: (timeZone: TimeZone) => void;
  onRefreshIntervalChange: (interval: string[]) => void;
  onNowDelayChange: (nowDelay: string) => void;
  onHideTimePickerChange: (hide: boolean) => void;
  onLiveNowChange: (liveNow: boolean) => void;
  refreshIntervals?: string[];
  timePickerHidden?: boolean;
  nowDelay?: string;
  timezone: TimeZone;
  weekStart?: WeekStart;
  liveNow?: boolean;
}

export const TimePickerSettings = memo(
  ({
    onWeekStartChange,
    onTimeZoneChange,
    onRefreshIntervalChange,
    onNowDelayChange,
    onHideTimePickerChange,
    onLiveNowChange,
    refreshIntervals,
    timePickerHidden,
    nowDelay,
    timezone,
    weekStart,
    liveNow,
  }: Props) => {
    const [isNowDelayValid, setIsNowDelayValid] = useState(true);
    const [personalRange, setPersonalRange] = useState<TimeOption>({ from: '', to: '', display: '' });
    const { ranges: personalRanges, addRange, removeRange } = usePersonalQuickRanges();

    const handleNowDelayChange = (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;

      if (isEmpty(value)) {
        setIsNowDelayValid(true);
        return onNowDelayChange(value);
      }

      if (rangeUtil.isValidTimeSpan(value)) {
        setIsNowDelayValid(true);
        return onNowDelayChange(value);
      }

      setIsNowDelayValid(false);
    };

    const handleHideTimePickerChange = () => {
      onHideTimePickerChange(!timePickerHidden);
    };

    const handleLiveNowChange = () => {
      onLiveNowChange(!liveNow);
    };

    const handleTimeZoneChange = (timeZone?: string) => {
      if (typeof timeZone !== 'string') {
        return;
      }
      onTimeZoneChange(timeZone);
    };

    const handleWeekStartChange = (weekStart?: WeekStart) => {
      onWeekStartChange(weekStart);
    };

    const handleAddPersonalRange = () => {
      addRange(personalRange);
      setPersonalRange({ from: '', to: '', display: '' });
    };

    return (
      <CollapsableSection label={t('dashboard-settings.time-picker.time-options-label', 'Time options')} isOpen={true}>
        <Field
          label={t('dashboard-settings.time-picker.time-zone-label', 'Time zone')}
          data-testid={selectors.components.TimeZonePicker.containerV2}
        >
          <TimeZonePicker
            inputId="time-options-input"
            includeInternal={true}
            value={timezone}
            onChange={handleTimeZoneChange}
            width={40}
          />
        </Field>
        <Field
          label={t('dashboard-settings.time-picker.week-start-label', 'Week start')}
          data-testid={selectors.components.WeekStartPicker.containerV2}
        >
          <WeekStartPicker inputId="week-start-input" width={40} value={weekStart} onChange={handleWeekStartChange} />
        </Field>
        <AutoRefreshIntervals refreshIntervals={refreshIntervals} onRefreshIntervalChange={onRefreshIntervalChange} />
        <Field
          label={t('dashboard-settings.time-picker.now-delay-label', 'Now delay')}
          description={t(
            'dashboard-settings.time-picker.now-delay-description',
            'Exclude recent data that may be incomplete.'
          )}
        >
          <Input
            id="now-delay-input"
            invalid={!isNowDelayValid}
            // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
            placeholder="0m"
            onChange={handleNowDelayChange}
            defaultValue={nowDelay}
          />
        </Field>
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.personal-ranges-label', 'Your ranges')}
          description={t(
            'dashboard-settings.time-picker.personal-ranges-description',
            'Quick ranges saved in this browser and available on every dashboard.'
          )}
        >
          <Stack direction="column" gap={1}>
            {personalRanges.map((range) => (
              <Stack key={`${range.from}-${range.to}`} justifyContent="space-between" alignItems="center">
                <span>
                  {range.display} ({range.from} – {range.to})
                </span>
                <IconButton
                  name="trash-alt"
                  aria-label={t('dashboard-settings.time-picker.remove-personal-range', 'Remove {{range}}', {
                    range: range.display,
                  })}
                  onClick={() => removeRange(range)}
                />
              </Stack>
            ))}
            <Stack gap={1} wrap="wrap">
              <Input
                aria-label={t('dashboard-settings.time-picker.personal-range-name', 'Range name')}
                placeholder={t('dashboard-settings.time-picker.personal-range-name', 'Range name')}
                value={personalRange.display}
                onChange={(event) => setPersonalRange({ ...personalRange, display: event.currentTarget.value })}
              />
              <Input
                aria-label={t('dashboard-settings.time-picker.personal-range-from', 'From')}
                placeholder={t('dashboard-settings.time-picker.personal-range-from-placeholder', 'From, e.g. now-3h')}
                value={personalRange.from}
                onChange={(event) => setPersonalRange({ ...personalRange, from: event.currentTarget.value })}
              />
              <Input
                aria-label={t('dashboard-settings.time-picker.personal-range-to', 'To')}
                placeholder={t('dashboard-settings.time-picker.personal-range-to-placeholder', 'To, e.g. now')}
                value={personalRange.to}
                onChange={(event) => setPersonalRange({ ...personalRange, to: event.currentTarget.value })}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!personalRange.display || !personalRange.from || !personalRange.to}
                onClick={handleAddPersonalRange}
              >
                {t('dashboard-settings.time-picker.add-personal-range', 'Add range')}
              </Button>
            </Stack>
          </Stack>
        </Field>
        <Field label={t('dashboard-settings.time-picker.hide-time-picker', 'Hide time picker')}>
          <Switch id="hide-time-picker-toggle" value={!!timePickerHidden} onChange={handleHideTimePickerChange} />
        </Field>
        <Field
          label={t('dashboard-settings.time-picker.refresh-live-dashboards-label', 'Refresh live dashboards')}
          description={t(
            'dashboard-settings.time-picker.refresh-live-dashboards-description',
            'Continuously update panels when the time range includes the current time'
          )}
        >
          <Switch id="refresh-live-dashboards-toggle" value={!!liveNow} onChange={handleLiveNowChange} />
        </Field>
      </CollapsableSection>
    );
  }
);
TimePickerSettings.displayName = 'TimePickerSettings';
