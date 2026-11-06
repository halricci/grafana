import { type FormEvent, useState } from 'react';

import { dateMath } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';
import { Button, Field, IconButton, Input, Stack } from '@grafana/ui';
import { usePersonalQuickRanges, type PersonalQuickRange } from 'app/core/components/TimePicker/personalQuickRanges';

export function PersonalQuickRangesSettings() {
  const { ranges, add, remove } = usePersonalQuickRanges();
  const [display, setDisplay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const draft: PersonalQuickRange = {
    display: display.trim(),
    from: from.trim(),
    to: to.trim(),
  };
  const boundsValid =
    draft.from !== '' && draft.to !== '' && dateMath.isValid(draft.from) && dateMath.isValid(draft.to);
  const canAdd = Boolean(draft.display && boundsValid);

  const onAdd = () => {
    if (!canAdd) {
      return;
    }

    add(draft);
    setDisplay('');
    setFrom('');
    setTo('');
  };

  return (
    <Field
      noMargin
      label={t('dashboard-settings.time-picker.personal-quick-ranges-label', 'Your quick ranges')}
      description={t(
        'dashboard-settings.time-picker.personal-quick-ranges-description',
        'Saved in this browser for every dashboard you open. Adding or removing a range does not change the dashboard.'
      )}
    >
      <Stack direction="column" gap={1} data-testid={selectors.components.TimePicker.personalQuickRangesSettings}>
        {ranges.map((range) => (
          <Stack key={`${range.from}-${range.to}`} gap={1} alignItems="center" justifyContent="space-between">
            <span>
              {t('dashboard-settings.time-picker.personal-quick-ranges-value', '{{display}} ({{from}} to {{to}})', {
                display: range.display,
                from: range.from,
                to: range.to,
              })}
            </span>
            <IconButton
              name="trash-alt"
              tooltip={t('dashboard-settings.time-picker.personal-quick-ranges-remove', 'Remove {{display}}', {
                display: range.display,
              })}
              data-testid={selectors.components.TimePicker.removePersonalQuickRange(range.from, range.to)}
              onClick={() => remove(range)}
            />
          </Stack>
        ))}
        <Stack gap={1} alignItems="center" wrap="wrap">
          <Input
            id="personal-quick-range-name"
            width={20}
            placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-name', 'Name')}
            value={display}
            onChange={(event: FormEvent<HTMLInputElement>) => setDisplay(event.currentTarget.value)}
            data-testid={selectors.components.TimePicker.personalQuickRangeName}
          />
          <Input
            id="personal-quick-range-from"
            width={16}
            placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-from', 'From')}
            value={from}
            onChange={(event: FormEvent<HTMLInputElement>) => setFrom(event.currentTarget.value)}
            data-testid={selectors.components.TimePicker.personalQuickRangeFrom}
          />
          <Input
            id="personal-quick-range-to"
            width={16}
            placeholder={t('dashboard-settings.time-picker.personal-quick-ranges-to-input', 'To')}
            value={to}
            onChange={(event: FormEvent<HTMLInputElement>) => setTo(event.currentTarget.value)}
            data-testid={selectors.components.TimePicker.personalQuickRangeTo}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!canAdd}
            onClick={onAdd}
            data-testid={selectors.components.TimePicker.addPersonalQuickRange}
          >
            {t('dashboard-settings.time-picker.personal-quick-ranges-add', 'Add quick range')}
          </Button>
        </Stack>
      </Stack>
    </Field>
  );
}
