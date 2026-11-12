import { type TimeOption } from '@grafana/data';
import { t } from '@grafana/i18n';
import { isRelativeTimeExpression, MAX_PERSONAL_QUICK_RANGES } from '@grafana/ui';

const MAX_DISPLAY_LENGTH = 120;

export function validatePersonalQuickRange(
  input: { display: string; from: string; to: string },
  existing: TimeOption[]
): { range: TimeOption } | { error: string } {
  const display = input.display.trim();
  const from = input.from.trim();
  const to = input.to.trim();

  if (!display || !isRelativeTimeExpression(from) || !isRelativeTimeExpression(to)) {
    return {
      error: t(
        'dashboard-settings.time-picker.personal-range-invalid',
        'Enter a name and a relative range, such as now-12h to now.'
      ),
    };
  }

  if (display.length > MAX_DISPLAY_LENGTH) {
    return {
      error: t('dashboard-settings.time-picker.personal-range-name-too-long', 'Use a name of 120 characters or fewer.'),
    };
  }

  if (existing.some((range) => range.from === from && range.to === to)) {
    return {
      error: t('dashboard-settings.time-picker.personal-range-duplicate', 'That range is already in your ranges.'),
    };
  }

  if (existing.length >= MAX_PERSONAL_QUICK_RANGES) {
    return {
      error: t('dashboard-settings.time-picker.personal-range-limit', 'You can save up to 20 ranges.'),
    };
  }

  return { range: { display, from, to } };
}
