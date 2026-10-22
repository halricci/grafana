import { css } from '@emotion/css';
import { useState } from 'react';

import { type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';

import { TimeRangeList } from './TimeRangeList';
import { type SavePersonalQuickRangeResult } from './personalQuickRanges';

interface Props {
  quickOptions: TimeOption[];
  personalOptions: TimeOption[];
  allPersonalOptions: TimeOption[];
  value?: TimeOption;
  onSelect: (option: TimeOption) => void;
  onSave?: (option: TimeOption) => SavePersonalQuickRangeResult;
  onRemove?: (option: TimeOption) => void;
  currentOption?: TimeOption;
}

export const QuickRangeSections = ({
  quickOptions,
  personalOptions,
  allPersonalOptions,
  value,
  onSelect,
  onSave,
  onRemove,
  currentOption,
}: Props) => {
  const styles = useStyles2(getStyles);
  const [error, setError] = useState<string | undefined>();
  const alreadySaved =
    currentOption !== undefined &&
    allPersonalOptions.some((option) => option.from === currentOption.from && option.to === currentOption.to);

  const save = (option: TimeOption) => {
    if (!onSave) {
      return;
    }
    const result = onSave(option);
    setError(result.ok ? undefined : messageFor(result.reason));
  };

  return (
    <div className={styles.sections}>
      <section
        aria-label={t('time-picker.quick-ranges.yours-title', 'Your ranges')}
        data-testid={selectors.components.TimePicker.personalQuickRanges}
      >
        <div className={styles.heading}>
          <h3 className={styles.title}>{t('time-picker.quick-ranges.yours-title', 'Your ranges')}</h3>
          <p className={styles.description}>
            {t('time-picker.quick-ranges.yours-description', 'Saved in this browser, not on the dashboard.')}
          </p>
        </div>
        {onSave && currentOption && !alreadySaved && (
          <div className={styles.saveCurrent}>
            <Button
              size="sm"
              fill="text"
              variant="secondary"
              type="button"
              icon="bookmark"
              onClick={() => save(currentOption)}
              data-testid={selectors.components.TimePicker.saveCurrentQuickRange}
            >
              {t('time-picker.quick-ranges.save-current', 'Save current range')}
            </Button>
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {personalOptions.length > 0 && (
          <TimeRangeList options={personalOptions} value={value} onChange={onSelect} onRemove={onRemove} />
        )}
        {allPersonalOptions.length === 0 && (
          <p className={styles.empty}>{t('time-picker.quick-ranges.yours-empty', 'No saved ranges yet.')}</p>
        )}
      </section>
      <TimeRangeList
        title={t('time-picker.quick-ranges.dashboard-title', 'Dashboard ranges')}
        description={t('time-picker.quick-ranges.dashboard-description', 'Come from this dashboard.')}
        options={quickOptions}
        value={value}
        onChange={onSelect}
        onSave={onSave ? save : undefined}
        isSaved={(option) => allPersonalOptions.some((saved) => saved.from === option.from && saved.to === option.to)}
        testId={selectors.components.TimePicker.dashboardQuickRanges}
      />
    </div>
  );
};

function messageFor(reason: 'invalid' | 'duplicate' | 'limit'): string {
  switch (reason) {
    case 'duplicate':
      return t('time-picker.quick-ranges.error-duplicate', 'This range is already in your ranges.');
    case 'limit':
      return t('time-picker.quick-ranges.error-limit', 'You can save up to 15 ranges. Remove one to save another.');
    case 'invalid':
      return t('time-picker.quick-ranges.error-invalid', 'Enter a relative range such as now-6h to now.');
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  sections: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  heading: css({
    padding: '8px 16px 0 9px',
  }),
  title: css({
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    margin: 0,
  }),
  description: css({
    margin: theme.spacing(0.5, 0, 0),
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  saveCurrent: css({
    padding: theme.spacing(0, 0.5),
  }),
  empty: css({
    margin: 0,
    padding: theme.spacing(0.5, 1, 1),
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  error: css({
    margin: 0,
    padding: theme.spacing(0, 1, 0.5),
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
