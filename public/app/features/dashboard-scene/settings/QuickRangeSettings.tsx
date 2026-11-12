import { type FormEvent, useState } from 'react';

import { type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Field, Input, Stack } from '@grafana/ui';
import { usePersonalQuickRanges } from 'app/core/components/TimePicker/personalQuickRanges';

import { validatePersonalQuickRange } from './personalQuickRangeForm';

interface Props {
  dashboardQuickRanges?: TimeOption[];
}

export function QuickRangeSettings({ dashboardQuickRanges }: Props) {
  const [personalRanges, setPersonalRanges] = usePersonalQuickRanges();
  const [display, setDisplay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onAdd = () => {
    const result = validatePersonalQuickRange({ display, from, to }, personalRanges);
    if ('error' in result) {
      setError(result.error);
      return;
    }

    setPersonalRanges([result.range, ...personalRanges]);
    setDisplay('');
    setFrom('');
    setTo('');
    setError(undefined);
  };

  const onRemove = (range: TimeOption) => {
    setPersonalRanges(personalRanges.filter((item) => item.from !== range.from || item.to !== range.to));
  };

  return (
    <>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.dashboard-ranges-label', 'Dashboard ranges')}
        description={t(
          'dashboard-settings.time-picker.dashboard-ranges-description',
          'Saved on this dashboard for everyone who opens it.'
        )}
      >
        <div data-testid={selectors.components.TimePickerSettings.dashboardQuickRanges}>
          {dashboardQuickRanges?.length ? (
            <Stack direction="column" gap={0.5}>
              {dashboardQuickRanges.map((range) => (
                <span key={`${range.from}-${range.to}-${range.display}`}>
                  {t('dashboard-settings.time-picker.range-summary', '{{display}} ({{from}} to {{to}})', {
                    display: range.display,
                    from: range.from,
                    to: range.to,
                  })}
                </span>
              ))}
            </Stack>
          ) : (
            <span>
              {t(
                'dashboard-settings.time-picker.dashboard-ranges-empty',
                'This dashboard has no quick ranges of its own.'
              )}
            </span>
          )}
        </div>
      </Field>
      <Field
        noMargin
        label={t('dashboard-settings.time-picker.personal-ranges-label', 'Your ranges')}
        description={t(
          'dashboard-settings.time-picker.personal-ranges-description',
          'Saved in this browser for you. They are available the next time you open a dashboard, and they are not saved on the dashboard.'
        )}
      >
        <div data-testid={selectors.components.TimePickerSettings.personalQuickRanges}>
          <Stack direction="column" gap={1}>
            {personalRanges.length === 0 ? (
              <span>
                {t('dashboard-settings.time-picker.personal-ranges-empty', 'You have not saved any ranges yet.')}
              </span>
            ) : (
              personalRanges.map((range) => (
                <Stack
                  key={`${range.from}-${range.to}`}
                  direction="row"
                  gap={1}
                  alignItems="center"
                  data-testid={selectors.components.TimePickerSettings.personalQuickRange(range.from, range.to)}
                >
                  <span>
                    {t('dashboard-settings.time-picker.range-summary', '{{display}} ({{from}} to {{to}})', {
                      display: range.display,
                      from: range.from,
                      to: range.to,
                    })}
                  </span>
                  <Button
                    fill="text"
                    size="sm"
                    onClick={() => onRemove(range)}
                    aria-label={t(
                      'dashboard-settings.time-picker.personal-range-remove',
                      'Remove {{display}} from your ranges',
                      {
                        display: range.display,
                      }
                    )}
                  >
                    {t('dashboard-settings.time-picker.personal-range-remove-label', 'Remove')}
                  </Button>
                </Stack>
              ))
            )}
            <Input
              id="personal-quick-range-name"
              placeholder={t('dashboard-settings.time-picker.personal-range-name-placeholder', 'Last 12 hours')}
              value={display}
              onChange={(event: FormEvent<HTMLInputElement>) => setDisplay(event.currentTarget.value)}
              aria-label={t('dashboard-settings.time-picker.personal-range-name', 'Range name')}
            />
            <Input
              id="personal-quick-range-from"
              placeholder={t('dashboard-settings.time-picker.personal-range-from-placeholder', 'now-12h')}
              value={from}
              onChange={(event: FormEvent<HTMLInputElement>) => setFrom(event.currentTarget.value)}
              aria-label={t('dashboard-settings.time-picker.personal-range-from', 'From')}
            />
            <Input
              id="personal-quick-range-to"
              placeholder={t('dashboard-settings.time-picker.personal-range-to-placeholder', 'now')}
              value={to}
              onChange={(event: FormEvent<HTMLInputElement>) => setTo(event.currentTarget.value)}
              aria-label={t('dashboard-settings.time-picker.personal-range-to', 'To')}
            />
            {error && <span role="alert">{error}</span>}
            <Button
              fill="outline"
              size="sm"
              onClick={onAdd}
              data-testid={selectors.components.TimePickerSettings.addPersonalQuickRange}
            >
              {t('dashboard-settings.time-picker.personal-range-add', 'Add to your ranges')}
            </Button>
          </Stack>
        </div>
      </Field>
    </>
  );
}
