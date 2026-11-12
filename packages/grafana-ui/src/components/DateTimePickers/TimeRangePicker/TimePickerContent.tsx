import { css, cx } from '@emotion/css';
import { memo, useContext, useMemo, useState } from 'react';

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
import {
  isRelativeTimeExpression,
  MAX_PERSONAL_QUICK_RANGES,
  rangesEqual,
  TimePickerQuickRangeGroupsContext,
} from './quickRangeGroups';

const EMPTY_QUICK_RANGES: TimeOption[] = [];

interface Props {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onChangeFiscalYearStartMonth?: (month: number) => void;
  onError?: (error?: string) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  quickOptions?: TimeOption[];
  /** The signed-in user's quick ranges. Kept off the dashboard. */
  personalQuickRanges?: TimeOption[];
  onPersonalQuickRangesChange?: (ranges: TimeOption[]) => void;
  /** Quick ranges stored on the dashboard. Omit when the dashboard has none. */
  dashboardQuickRanges?: TimeOption[];
  history?: TimeRange[];
  showHistory?: boolean;
  className?: string;
  hideTimeZone?: boolean;
  /** Reverse the order of relative and absolute range pickers. Used to left align the picker in forms */
  isReversed?: boolean;
  hideQuickRanges?: boolean;
  widthOverride?: number;
  weekStart?: WeekStart;
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
    personalQuickRanges: personalQuickRangesProp,
    onPersonalQuickRangesChange: onPersonalQuickRangesChangeProp,
    dashboardQuickRanges: dashboardQuickRangesProp,
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
  } = props;
  const quickRangeGroups = useContext(TimePickerQuickRangeGroupsContext);
  const personalRanges = personalQuickRangesProp ?? quickRangeGroups?.personalRanges ?? EMPTY_QUICK_RANGES;
  const onPersonalQuickRangesChange = onPersonalQuickRangesChangeProp ?? quickRangeGroups?.onPersonalQuickRangesChange;
  const dashboardRanges = dashboardQuickRangesProp ?? quickRangeGroups?.dashboardRanges;
  // SceneTimePicker passes dashboard ranges in place of the built-in list. Label that list
  // instead of rendering it twice.
  const quickOptionsAreDashboard = rangesEqual(quickOptions, dashboardRanges);

  const isHistoryEmpty = !history?.length;
  const isContainerTall =
    (isFullscreen && showHistory) || (!isFullscreen && ((showHistory && !isHistoryEmpty) || !hideQuickRanges));
  const styles = useStyles2(getStyles, isReversed, hideQuickRanges, isContainerTall, isFullscreen);
  const historyOptions = mapToHistoryOptions(history, timeZone);
  const selectableOptions = useMemo(
    () => [...personalRanges, ...(dashboardRanges ?? []), ...quickOptions],
    [personalRanges, dashboardRanges, quickOptions]
  );
  const baseTimeOption = useTimeOption(value.raw, selectableOptions);
  const [searchTerm, setSearchQuery] = useState('');

  const { filteredStandard, filteredDashboard, filteredPersonal, customTimeOption } = useMemo(() => {
    const query = searchTerm.toLowerCase();
    const matches = (option: TimeOption) => option.display.toLowerCase().includes(query);
    const standardSource = quickOptionsAreDashboard ? [] : quickOptions;
    const dashboardSource = quickOptionsAreDashboard ? quickOptions : (dashboardRanges ?? []);
    let filteredStandard = standardSource.filter(matches);
    const filteredDashboard = dashboardSource.filter(matches);
    const filteredPersonal = personalRanges.filter(matches);
    const described = isValidGrafanaDuration(searchTerm) && rangeUtil.describeTextRange(searchTerm);

    if (described) {
      const alreadyExists = [...filteredStandard, ...filteredDashboard, ...filteredPersonal].some(
        (option) => option.from === described.from && option.to === described.to
      );
      if (!alreadyExists) {
        filteredStandard = [described, ...filteredStandard];
        return { filteredStandard, filteredDashboard, filteredPersonal, customTimeOption: described };
      }
    }

    return { filteredStandard, filteredDashboard, filteredPersonal, customTimeOption: undefined };
  }, [searchTerm, quickOptions, quickOptionsAreDashboard, dashboardRanges, personalRanges]);

  const timeOption = customTimeOption || baseTimeOption;
  const currentPersonalRange = relativeOptionFromValue(value.raw);
  const currentRangeAlreadySaved =
    !!currentPersonalRange &&
    personalRanges.some((option) => option.from === currentPersonalRange.from && option.to === currentPersonalRange.to);
  const canSavePersonal = !!onPersonalQuickRangesChange && !!currentPersonalRange && !currentRangeAlreadySaved;

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption));
  };

  const onSavePersonal = () => {
    if (!currentPersonalRange || !onPersonalQuickRangesChange) {
      return;
    }
    onPersonalQuickRangesChange([currentPersonalRange, ...personalRanges].slice(0, MAX_PERSONAL_QUICK_RANGES));
  };

  const onRemovePersonal = (option: TimeOption) => {
    onPersonalQuickRangesChange?.(
      personalRanges.filter((range) => range.from !== option.from || range.to !== option.to)
    );
  };

  const showPersonalSection = filteredPersonal.length > 0 || (canSavePersonal && searchTerm === '');
  const showOtherGroup = showPersonalSection || filteredDashboard.length > 0;

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
              {!hideQuickRanges && (
                <>
                  {showPersonalSection && (
                    <TimeRangeList
                      title={t('time-picker.personal.title', 'Your ranges')}
                      testId={selectors.components.TimePicker.personalQuickRanges}
                      options={filteredPersonal}
                      onChange={onChangeTimeOption}
                      onRemove={onPersonalQuickRangesChange ? onRemovePersonal : undefined}
                      value={timeOption}
                      actions={
                        canSavePersonal && searchTerm === '' ? (
                          <Button
                            size="sm"
                            fill="text"
                            onClick={onSavePersonal}
                            data-testid={selectors.components.TimePicker.savePersonalQuickRange}
                          >
                            {t('time-picker.personal.save', 'Save to your ranges')}
                          </Button>
                        ) : undefined
                      }
                    />
                  )}
                  {filteredDashboard.length > 0 && (
                    <TimeRangeList
                      title={t('time-picker.dashboard.title', 'Dashboard ranges')}
                      testId={selectors.components.TimePicker.dashboardQuickRanges}
                      options={filteredDashboard}
                      onChange={onChangeTimeOption}
                      value={timeOption}
                    />
                  )}
                  {filteredStandard.length > 0 && (
                    <TimeRangeList
                      title={showOtherGroup ? t('time-picker.quick.title', 'Quick ranges') : undefined}
                      options={filteredStandard}
                      onChange={onChangeTimeOption}
                      value={timeOption}
                    />
                  )}
                </>
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

function relativeOptionFromValue(raw: RawTimeRange): TimeOption | null {
  if (typeof raw.from !== 'string' || typeof raw.to !== 'string') {
    return null;
  }
  const from = raw.from.trim();
  const to = raw.to.trim();
  if (!isRelativeTimeExpression(from) || !isRelativeTimeExpression(to)) {
    return null;
  }
  return {
    from,
    to,
    display: rangeUtil.describeTimeRange({ from, to }),
  };
}

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
