import { css, cx } from '@emotion/css';
import { memo, useMemo, useState } from 'react';

import {
  type GrafanaTheme2,
  isDateTime,
  isValidGrafanaDuration,
  rangeUtil,
  type RawTimeRange,
  type TimeOption,
  type TimeRange,
  type TimeZone,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';

import { useStyles2, useTheme2 } from '../../../themes/ThemeContext';
import { getFocusStyles } from '../../../themes/mixins';
import { Button } from '../../Button/Button';
import { FilterInput } from '../../FilterInput/FilterInput';
import { Icon } from '../../Icon/Icon';
import { TextLink } from '../../Link/TextLink';
import { type WeekStart } from '../WeekStartPicker';

import { TimePickerFooter } from './TimePickerFooter';
import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeContent } from './TimeRangeContent';
import { TimeRangeList } from './TimeRangeList';
import { mapOptionToTimeRange, mapRangeToTimeOption } from './mapper';
import { toPersonalQuickRange } from './personalQuickRanges';

interface Props {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onChangeFiscalYearStartMonth?: (month: number) => void;
  onError?: (error?: string) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  quickOptions?: TimeOption[];
  history?: TimeRange[];
  showHistory?: boolean;
  className?: string;
  hideTimeZone?: boolean;
  /** Reverse the order of relative and absolute range pickers. Used to left align the picker in forms */
  isReversed?: boolean;
  hideQuickRanges?: boolean;
  widthOverride?: number;
  weekStart?: WeekStart;
  personalQuickRanges?: TimeOption[];
  onSavePersonalQuickRange?: (range: TimeRange) => void;
  onRemovePersonalQuickRange?: (option: TimeOption) => void;
  quickRangesFromDashboard?: boolean;
}

export interface PropsWithScreenSize extends Props {
  isFullscreen: boolean;
}

interface FormProps extends Omit<Props, 'history'> {
  historyOptions?: TimeOption[];
}

export const TimePickerContentWithScreenSize = (props: PropsWithScreenSize) => {
  const {
    quickOptions = [],
    isReversed,
    isFullscreen,
    hideQuickRanges,
    timeZone,
    fiscalYearStartMonth,
    value,
    onChange,
    history,
    showHistory,
    className,
    hideTimeZone,
    onChangeTimeZone,
    onChangeFiscalYearStartMonth,
    personalQuickRanges,
    onSavePersonalQuickRange,
    onRemovePersonalQuickRange,
    quickRangesFromDashboard,
  } = props;
  const showPersonal = personalQuickRanges !== undefined && !hideQuickRanges;
  const isHistoryEmpty = !history?.length;
  const isContainerTall =
    (isFullscreen && showHistory) || (!isFullscreen && ((showHistory && !isHistoryEmpty) || !hideQuickRanges));
  const styles = useStyles2(getStyles, isReversed, hideQuickRanges, isContainerTall, isFullscreen);
  const historyOptions = mapToHistoryOptions(history, timeZone);
  const selectionOptions = useMemo(
    () => [...(personalQuickRanges ?? []), ...quickOptions],
    [personalQuickRanges, quickOptions]
  );
  const baseTimeOption = useTimeOption(value.raw, selectionOptions);
  const [searchTerm, setSearchQuery] = useState('');

  const { filteredQuickOptions, customTimeOption } = useMemo(() => {
    const filtered = quickOptions.filter((o) => o.display.toLowerCase().includes(searchTerm.toLowerCase()));
    const customTimeOption = isValidGrafanaDuration(searchTerm) && rangeUtil.describeTextRange(searchTerm);

    if (customTimeOption) {
      const alreadyExists = filtered.some((o) => o.from === customTimeOption.from && o.to === customTimeOption.to);

      if (!alreadyExists) {
        return { filteredQuickOptions: [customTimeOption, ...filtered], customTimeOption };
      }
    }

    return { filteredQuickOptions: filtered, customTimeOption: undefined };
  }, [searchTerm, quickOptions]);

  const filteredPersonalOptions = useMemo(() => {
    if (!personalQuickRanges) {
      return [];
    }
    const term = searchTerm.toLowerCase();
    return personalQuickRanges.filter((option) => option.display.toLowerCase().includes(term));
  }, [personalQuickRanges, searchTerm]);

  const timeOption = customTimeOption || baseTimeOption;

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption));
  };

  return (
    <div id="TimePickerContent" className={cx(styles.container, className)}>
      <div className={styles.body}>
        {(!isFullscreen || !hideQuickRanges) && (
          <div className={styles.rightSide}>
            <div className={styles.timeRangeFilter}>
              <FilterInput
                width={0}
                value={searchTerm}
                onChange={setSearchQuery}
                escapeRegex={false}
                placeholder={t('time-picker.content.filter-placeholder', 'Search quick ranges')}
              />
            </div>
            <div className={styles.scrollContent}>
              {!isFullscreen && <NarrowScreenForm {...props} historyOptions={historyOptions} />}
              {showPersonal && (
                <PersonalQuickRanges
                  options={filteredPersonalOptions}
                  value={timeOption}
                  currentRange={value}
                  savedRanges={personalQuickRanges ?? []}
                  searchTerm={searchTerm}
                  onChange={onChangeTimeOption}
                  onSave={onSavePersonalQuickRange}
                  onRemove={onRemovePersonalQuickRange}
                />
              )}
              {!hideQuickRanges && (
                <TimeRangeList
                  title={quickRangeTitle(showPersonal, quickRangesFromDashboard)}
                  options={filteredQuickOptions}
                  onChange={onChangeTimeOption}
                  value={timeOption}
                />
              )}
            </div>
          </div>
        )}
        {isFullscreen && (
          <div className={styles.leftSide}>
            <FullScreenForm {...props} historyOptions={historyOptions} />
          </div>
        )}
      </div>
      {!hideTimeZone && isFullscreen && (
        <TimePickerFooter
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onChangeTimeZone={onChangeTimeZone}
          onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
        />
      )}
    </div>
  );
};

export const TimePickerContent = (props: Props) => {
  const { widthOverride } = props;
  const theme = useTheme2();
  const isFullscreen = (widthOverride || window.innerWidth) >= theme.breakpoints.values.lg;
  return <TimePickerContentWithScreenSize {...props} isFullscreen={isFullscreen} />;
};

function quickRangeTitle(showPersonal: boolean, quickRangesFromDashboard?: boolean): string | undefined {
  if (quickRangesFromDashboard) {
    return t('time-picker.quick.dashboard-title', 'Dashboard ranges');
  }
  if (showPersonal) {
    return t('time-picker.quick.builtin-title', 'Quick ranges');
  }
  return undefined;
}

const PersonalQuickRanges = ({
  options,
  value,
  currentRange,
  savedRanges,
  searchTerm,
  onChange,
  onSave,
  onRemove,
}: {
  options: TimeOption[];
  value?: TimeOption;
  currentRange: TimeRange;
  savedRanges: TimeOption[];
  searchTerm: string;
  onChange: (option: TimeOption) => void;
  onSave?: (range: TimeRange) => void;
  onRemove?: (option: TimeOption) => void;
}) => {
  const styles = useStyles2(getPersonalStyles);
  const title = t('time-picker.personal.title', 'Your ranges');
  const current = toPersonalQuickRange(currentRange);
  const isSaved =
    current !== null && savedRanges.some((option) => option.from === current.from && option.to === current.to);

  return (
    <section aria-label={title}>
      <div className={styles.header}>
        <TimePickerTitle>{title}</TimePickerTitle>
        {onSave && (
          <Button
            size="sm"
            variant="secondary"
            fill="text"
            icon="plus"
            disabled={current === null || isSaved}
            data-testid={selectors.components.TimePicker.savePersonalQuickRangeButton}
            onClick={() => onSave(currentRange)}
          >
            {isSaved ? t('time-picker.personal.saved', 'Saved') : t('time-picker.personal.save', 'Save current range')}
          </Button>
        )}
      </div>
      {options.length > 0 ? (
        <TimeRangeList options={options} onChange={onChange} onRemove={onRemove} value={value} />
      ) : (
        searchTerm === '' && <p className={styles.empty}>{t('time-picker.personal.empty', 'No saved ranges yet.')}</p>
      )}
    </section>
  );
};

const NarrowScreenForm = (props: FormProps) => {
  const { value, hideQuickRanges, onChange, timeZone, historyOptions = [], showHistory, onError, weekStart } = props;
  const styles = useStyles2(getNarrowScreenStyles);
  const isAbsolute = isDateTime(value.raw.from) || isDateTime(value.raw.to);
  const [collapsedFlag, setCollapsedFlag] = useState(!isAbsolute);
  const collapsed = hideQuickRanges ? false : collapsedFlag;

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  return (
    <fieldset>
      <div className={styles.header}>
        <button
          type={'button'}
          className={styles.expandButton}
          onClick={() => {
            if (!hideQuickRanges) {
              setCollapsedFlag(!collapsed);
            }
          }}
          data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}
          aria-expanded={!collapsed}
          aria-controls="expanded-timerange"
        >
          <TimePickerTitle>
            <Trans i18nKey="time-picker.absolute.title">Absolute time range</Trans>
          </TimePickerTitle>
          {!hideQuickRanges && <Icon name={!collapsed ? 'angle-up' : 'angle-down'} />}
        </button>
      </div>
      {!collapsed && (
        <div className={styles.body} id="expanded-timerange">
          <div className={styles.form}>
            <TimeRangeContent
              value={value}
              onApply={onChange}
              timeZone={timeZone}
              isFullscreen={false}
              onError={onError}
              weekStart={weekStart}
            />
          </div>
          {showHistory && (
            <TimeRangeList
              title={t('time-picker.absolute.recent-title', 'Recently used absolute ranges')}
              options={historyOptions}
              onChange={onChangeTimeOption}
              placeholderEmpty={null}
            />
          )}
        </div>
      )}
    </fieldset>
  );
};

const FullScreenForm = (props: FormProps) => {
  const { onChange, value, timeZone, fiscalYearStartMonth, isReversed, historyOptions, onError, weekStart } = props;
  const styles = useStyles2(getFullScreenStyles, props.hideQuickRanges);
  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title} data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}>
          <TimePickerTitle>
            <Trans i18nKey="time-picker.absolute.title">Absolute time range</Trans>
          </TimePickerTitle>
        </div>
        <TimeRangeContent
          value={value}
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onApply={onChange}
          isFullscreen={true}
          isReversed={isReversed}
          onError={onError}
          weekStart={weekStart}
        />
      </div>
      {props.showHistory && (
        <div className={styles.recent}>
          <TimeRangeList
            title={t('time-picker.absolute.recent-title', 'Recently used absolute ranges')}
            options={historyOptions || []}
            onChange={onChangeTimeOption}
            placeholderEmpty={<EmptyRecentList />}
          />
        </div>
      )}
    </>
  );
};

const EmptyRecentList = memo(() => {
  const styles = useStyles2(getEmptyListStyles);
  const emptyRecentListText = t(
    'time-picker.content.empty-recent-list-info',
    "It looks like you haven't used this time picker before. As soon as you enter some time intervals, recently used intervals will appear here."
  );

  return (
    <div className={styles.container}>
      <div>
        <span>{emptyRecentListText}</span>
      </div>
      <Trans i18nKey="time-picker.content.empty-recent-list-docs">
        <div>
          <TextLink href="https://grafana.com/docs/grafana/latest/dashboards/time-range-controls" external>
            Read the documentation
          </TextLink>
          <span> to find out more about how to enter custom time ranges.</span>
        </div>
      </Trans>
    </div>
  );
});

function mapToHistoryOptions(ranges?: TimeRange[], timeZone?: TimeZone): TimeOption[] {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return [];
  }

  return ranges.map((range) => mapRangeToTimeOption(range, timeZone));
}

EmptyRecentList.displayName = 'EmptyRecentList';

const useTimeOption = (raw: RawTimeRange, quickOptions: TimeOption[]): TimeOption | undefined => {
  return useMemo(() => {
    if (!rangeUtil.isRelativeTimeRange(raw)) {
      return;
    }
    return quickOptions.find((option) => {
      return option.from === raw.from && option.to === raw.to;
    });
  }, [raw, quickOptions]);
};

const getStyles = (
  theme: GrafanaTheme2,
  isReversed?: boolean,
  hideQuickRanges?: boolean,
  isContainerTall?: boolean,
  isFullscreen?: boolean
) => {
  const visualRefreshEnabled = theme.flags.visualDesignRefresh;
  return {
    container: css({
      background: theme.colors.background.elevated,
      boxShadow: visualRefreshEnabled ? theme.shadows.z2 : theme.shadows.z3,
      width: `${isFullscreen ? '546px' : '262px'}`,
      borderRadius: theme.shape.radius.lg,
      border: `1px solid ${theme.colors.border.weak}`,
      [`${isReversed ? 'left' : 'right'}`]: 0,
      display: 'flex',
      flexDirection: 'column',
    }),
    body: css({
      display: 'flex',
      flexDirection: 'row-reverse',
      height: `${isContainerTall ? '381px' : '217px'}`,
      maxHeight: '100vh',
    }),
    leftSide: css({
      display: 'flex',
      flexDirection: 'column',
      borderRight: `${isReversed ? 'none' : `1px solid ${theme.colors.border.weak}`}`,
      width: `${!hideQuickRanges ? '60%' : '100%'}`,
      overflow: 'auto',
      scrollbarWidth: 'thin',
      order: isReversed ? 1 : 0,
    }),
    rightSide: css({
      width: `${isFullscreen ? '40%' : '100%'}; !important`,
      borderRight: isReversed ? `1px solid ${theme.colors.border.weak}` : 'none',
      display: 'flex',
      flexDirection: 'column',
    }),
    timeRangeFilter: css({
      padding: theme.spacing(1),
    }),
    spacing: css({
      marginTop: '16px',
    }),
    scrollContent: css({
      overflowY: 'auto',
      scrollbarWidth: 'thin',
    }),
  };
};

const getPersonalStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    padding: '8px 16px 5px 9px',
  }),
  empty: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
    padding: theme.spacing(0, 2, 1),
  }),
});

const getNarrowScreenStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    padding: '7px 9px 7px 9px',
  }),
  expandButton: css({
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    width: '100%',

    '&:focus-visible': getFocusStyles(theme),
  }),
  body: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  form: css({
    padding: '7px 9px 7px 9px',
  }),
});

const getFullScreenStyles = (theme: GrafanaTheme2, hideQuickRanges?: boolean) => ({
  container: css({
    paddingTop: '9px',
    paddingLeft: '11px',
    paddingRight: !hideQuickRanges ? '20%' : '11px',
  }),
  title: css({
    marginBottom: '11px',
  }),
  recent: css({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingTop: theme.spacing(1),
  }),
});

const getEmptyListStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: '12px',
    margin: '12px',

    'a, span': {
      fontSize: '13px',
    },
  }),
});
