import { css } from '@emotion/css';

import { type GrafanaTheme2, type TimeOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';

import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeList } from './TimeRangeList';

export type QuickRangeSource = 'dashboard' | 'builtin';

interface Props {
  personalOptions: TimeOption[];
  savedCount: number;
  quickOptions: TimeOption[];
  quickCount: number;
  source: QuickRangeSource;
  selected?: TimeOption;
  alreadySaved: boolean;
  onSelect: (option: TimeOption) => void;
  onSave: () => void;
  onRemove: (option: TimeOption) => void;
}

export function QuickRangeSections({
  personalOptions,
  savedCount,
  quickOptions,
  quickCount,
  source,
  selected,
  alreadySaved,
  onSelect,
  onSave,
  onRemove,
}: Props) {
  const styles = useStyles2(getStyles);
  const yours = t('time-picker.personal.title', 'Your ranges');
  const quickTitle =
    source === 'dashboard'
      ? t('time-picker.dashboard.title', 'Dashboard')
      : t('time-picker.quick.title', 'Quick ranges');

  return (
    <>
      <section
        aria-label={yours}
        className={styles.personal}
        data-testid={selectors.components.TimePicker.personalQuickRanges}
      >
        <div className={styles.title}>
          <TimePickerTitle>{yours}</TimePickerTitle>
        </div>
        <p className={styles.caption}>{t('time-picker.personal.caption', 'Saved in this browser')}</p>
        <div className={styles.save}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={alreadySaved ? 'check' : 'plus'}
            fullWidth
            disabled={alreadySaved}
            onClick={onSave}
            data-testid={selectors.components.TimePicker.savePersonalQuickRange}
          >
            {alreadySaved
              ? t('time-picker.personal.saved', 'Saved to your ranges')
              : t('time-picker.personal.save', 'Save current range')}
          </Button>
        </div>
        {savedCount === 0 ? (
          <p className={styles.empty}>{t('time-picker.personal.empty', 'No saved ranges yet.')}</p>
        ) : (
          <TimeRangeList options={personalOptions} value={selected} onChange={onSelect} onRemove={onRemove} />
        )}
      </section>
      <div className={styles.dashboard}>
        <TimeRangeList title={quickTitle} options={quickOptions} value={selected} onChange={onSelect} />
        {source === 'dashboard' && quickCount === 0 && (
          <p className={styles.empty}>{t('time-picker.dashboard.empty', 'This dashboard has no quick ranges.')}</p>
        )}
      </div>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  personal: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  dashboard: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1),
  }),
  title: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 0 9px',
  }),
  caption: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
    padding: '0 16px 4px 9px',
  }),
  save: css({
    padding: '0 8px 4px',
  }),
  empty: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
    padding: '4px 16px 8px 9px',
  }),
});
