import { useCallback } from 'react';

import { type DataFrame, ReducerID, type TimeRange } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { hasVisibleLegendSeries, PlotLegend, shouldShowLegend, type UPlotConfigBuilder } from '@grafana/ui/internal';
import { type TimeSeriesLegendOptions } from 'app/plugins/panel/timeseries/panelcfg.gen';

import { GraphNG, type GraphNGProps, type PropDiffFn } from '../GraphNG/GraphNG';

import { getXAxisConfig, preparePlotConfigBuilder } from './utils';

const propsToDiff: Array<string | PropDiffFn> = ['legend', 'options', 'annotationLanes', 'theme'];

// The switch is separate from the legend Values picker, so append the reducer
// unless the user already selected it.
function withLastNotNullCalc(legend: TimeSeriesLegendOptions): TimeSeriesLegendOptions {
  if (!legend.showLastNotNull) {
    return legend;
  }

  const calcs = legend.calcs ?? [];
  if (calcs.includes(ReducerID.lastNotNull)) {
    return legend;
  }

  return { ...legend, calcs: [...calcs, ReducerID.lastNotNull] };
}

type TimeSeriesProps = Omit<GraphNGProps, 'prepConfig' | 'propsToDiff' | 'renderLegend' | 'theme' | 'legend'> & {
  legend: TimeSeriesLegendOptions;
  onPinnedToSidebarChange?: (pinned: boolean) => void;
};

export function TimeSeries(props: TimeSeriesProps) {
  const { timeZone, options, renderers, tweakAxis, tweakScale, legend, frames, onPinnedToSidebarChange } = props;
  const theme = useTheme2();

  const prepConfig = useCallback(
    (alignedFrame: DataFrame, allFrames: DataFrame[], getTimeRange: () => TimeRange, annotationLanes?: number) => {
      return preparePlotConfigBuilder({
        frame: alignedFrame,
        theme,
        timeZones: Array.isArray(timeZone) ? timeZone : [timeZone],
        getTimeRange,
        allFrames,
        renderers,
        tweakScale,
        tweakAxis,
        hoverProximity: options?.tooltip?.hoverProximity,
        orientation: options?.orientation,
        xAxisConfig: getXAxisConfig(annotationLanes),
      });
    },
    [theme, timeZone, options, renderers, tweakAxis, tweakScale]
  );

  const renderLegend = useCallback(
    (uPlotConfig: UPlotConfigBuilder) => {
      if (!uPlotConfig || (legend && !shouldShowLegend(legend)) || !hasVisibleLegendSeries(uPlotConfig, frames)) {
        return null;
      }

      return (
        <PlotLegend
          data={frames}
          config={uPlotConfig}
          {...withLastNotNullCalc(legend)}
          onPinnedToSidebarChange={onPinnedToSidebarChange}
        />
      );
    },
    [legend, frames, onPinnedToSidebarChange]
  );

  return (
    <GraphNG {...props} theme={theme} prepConfig={prepConfig} propsToDiff={propsToDiff} renderLegend={renderLegend} />
  );
}
