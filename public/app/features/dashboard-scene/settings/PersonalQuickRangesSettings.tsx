import { useState } from 'react';

import { t } from '@grafana/i18n';
import {
  Button,
  Field,
  IconButton,
  Input,
  Label,
  Stack,
  normalizeQuickRange,
  quickRangeInputError,
  usePersonalQuickRanges,
  type QuickRangeInputError,
} from '@grafana/ui';

export const PersonalQuickRangesSettings = () => {
  const { ranges, save, remove } = usePersonalQuickRanges();
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('now');
  const [error, setError] = useState<QuickRangeInputError | null>(null);

  const onAdd = () => {
    const nextError = quickRangeInputError(name, from, to);
    setError(nextError);
    if (nextError) {
      return;
    }

    const range = normalizeQuickRange(name, from, to);
    if (!range) {
      return;
    }

    save(range);
    setName('');
    setFrom('');
    setTo('now');
  };

  return (
    <Stack direction="column" gap={1}>
      <Label
        description={t(
          'dashboard-settings.time-picker.your-ranges-description',
          'Saved in this browser and shown on every dashboard. Adding or removing a range does not change the dashboard.'
        )}
      >
        {t('dashboard-settings.time-picker.your-ranges-label', 'Your quick ranges')}
      </Label>
      <Field
        label={t('dashboard-settings.time-picker.your-ranges-name', 'Name')}
        invalid={error === 'name'}
        error={error === 'name' ? t('dashboard-settings.time-picker.your-ranges-name-error', 'Enter a name') : undefined}
        noMargin
      >
        <Input
          id="personal-quick-range-name"
          value={name}
          placeholder={t('dashboard-settings.time-picker.your-ranges-name-placeholder', 'Deploy window')}
          onChange={(event) => {
            setName(event.currentTarget.value);
            if (error === 'name') {
              setError(null);
            }
          }}
        />
      </Field>
      <Field
        label={t('dashboard-settings.time-picker.your-ranges-from', 'From')}
        invalid={error === 'from'}
        error={
          error === 'from'
            ? t('dashboard-settings.time-picker.your-ranges-from-error', 'Enter a time like now-1h or a date')
            : undefined
        }
        noMargin
      >
        <Input
          id="personal-quick-range-from"
          value={from}
          // Time syntax, not a translated sentence.
          // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
          placeholder="now-1h"
          onChange={(event) => {
            setFrom(event.currentTarget.value);
            if (error === 'from') {
              setError(null);
            }
          }}
        />
      </Field>
      <Field
        label={t('dashboard-settings.time-picker.your-ranges-to', 'To')}
        invalid={error === 'to'}
        error={
          error === 'to'
            ? t('dashboard-settings.time-picker.your-ranges-to-error', 'Enter a time like now or a date')
            : undefined
        }
        noMargin
      >
        <Input
          id="personal-quick-range-to"
          value={to}
          // Time syntax, not a translated sentence.
          // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
          placeholder="now"
          onChange={(event) => {
            setTo(event.currentTarget.value);
            if (error === 'to') {
              setError(null);
            }
          }}
        />
      </Field>
      <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
        {t('dashboard-settings.time-picker.your-ranges-add', 'Add range')}
      </Button>
      {ranges.length === 0 ? (
        <span>{t('dashboard-settings.time-picker.your-ranges-empty', 'No quick ranges saved yet.')}</span>
      ) : (
        <Stack direction="column" gap={0.5}>
          {ranges.map((range) => (
            <Stack key={`${range.from}-${range.to}`} justifyContent="space-between" alignItems="center" gap={1}>
              <span>
                {t('dashboard-settings.time-picker.your-ranges-item', '{{display}} ({{from}} to {{to}})', {
                  display: range.display,
                  from: range.from,
                  to: range.to,
                })}
              </span>
              <IconButton
                name="trash-alt"
                variant="secondary"
                aria-label={t('dashboard-settings.time-picker.your-ranges-remove', 'Remove {{display}}', {
                  display: range.display,
                })}
                onClick={() => remove({ from: range.from, to: range.to })}
              />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
