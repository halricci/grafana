import { isEmpty } from 'lodash';
import { type FormEvent, memo, useState } from 'react';

import { rangeUtil, type TimeZone } from '@grafana/data';
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
import { createPersonalQuickRange, usePersonalQuickRanges } from 'app/core/components/TimePicker/personalQuickRanges';

import { AutoRefreshIntervals } from './AutoRefreshIntervals';

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
    const { ranges: personalRanges, save: savePersonalRange, remove: removePersonalRange } = usePersonalQuickRanges();
    const [personalName, setPersonalName] = useState('');
    const [personalFrom, setPersonalFrom] = useState('');
    const [personalTo, setPersonalTo] = useState('');
    const [personalError, setPersonalError] = useState<string>();

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
      const created = createPersonalQuickRange(personalFrom, personalTo, personalName);
      if (!created) {
        setPersonalError(
          t(
            'dashboard-settings.time-picker.personal-quick-ranges-invalid',
            'Enter a relative range, like 45m or now-45m to now.'
          )
        );
        return;
      }

      savePersonalRange(created);
      setPersonalName('');
      setPersonalFrom('');
      setPersonalTo('');
      setPersonalError(undefined);
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
        <Field
          noMargin
          label={t('dashboard-settings.time-picker.personal-quick-ranges-label', 'Your quick ranges')}
          description={t(
            'dashboard-settings.time-picker.personal-quick-ranges-description',
            'Saved in this browser and shown on every dashboard. Adding or removing one does not change this dashboard.'
          )}
        >
          <div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddPersonalRange();
              }}
            >
              <Stack gap={1} alignItems="center" wrap="wrap">
                <Input
                  id="personal-quick-range-name"
                  aria-label={t('dashboard-settings.time-picker.personal-quick-ranges-name', 'Name')}
                  placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-name-placeholder', 'Name')}
                  value={personalName}
                  onChange={(event) => setPersonalName(event.currentTarget.value)}
                  data-testid={selectors.components.TimePicker.personalQuickRangeName}
                  width={16}
                />
                <Input
                  id="personal-quick-range-from"
                  aria-label={t('dashboard-settings.time-picker.personal-quick-ranges-from', 'From')}
                  placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-from-placeholder', 'now-45m')}
                  value={personalFrom}
                  onChange={(event) => setPersonalFrom(event.currentTarget.value)}
                  data-testid={selectors.components.TimePicker.personalQuickRangeFrom}
                  width={16}
                />
                <Input
                  id="personal-quick-range-to"
                  aria-label={t('dashboard-settings.time-picker.personal-quick-ranges-to', 'To')}
                  placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-to-placeholder', 'now')}
                  value={personalTo}
                  onChange={(event) => setPersonalTo(event.currentTarget.value)}
                  data-testid={selectors.components.TimePicker.personalQuickRangeTo}
                  width={12}
                />
                <Button type="submit" data-testid={selectors.components.TimePicker.addPersonalQuickRange}>
                  {t('dashboard-settings.time-picker.personal-quick-ranges-add', 'Add')}
                </Button>
              </Stack>
            </form>
            {personalError && <div role="alert">{personalError}</div>}
            {personalRanges.length === 0 ? (
              <div>{t('dashboard-settings.time-picker.personal-quick-ranges-empty', 'No saved ranges yet.')}</div>
            ) : (
              <Stack direction="column" gap={0.5}>
                {personalRanges.map((range) => (
                  <Stack key={`${range.from}-${range.to}`} justifyContent="space-between" alignItems="center">
                    <span>
                      {t(
                        'dashboard-settings.time-picker.personal-quick-ranges-value',
                        '{{display}} ({{from}} to {{to}})',
                        { display: range.display, from: range.from, to: range.to }
                      )}
                    </span>
                    <IconButton
                      name="times"
                      aria-label={t(
                        'dashboard-settings.time-picker.personal-quick-ranges-remove',
                        'Remove {{display}}',
                        {
                          display: range.display,
                        }
                      )}
                      onClick={() => removePersonalRange(range)}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </div>
        </Field>
      </CollapsableSection>
    );
  }
);
TimePickerSettings.displayName = 'TimePickerSettings';
