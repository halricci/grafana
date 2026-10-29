import { render } from '@testing-library/react';

import { createDataFrame, FieldType } from '@grafana/data';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VizOrientation } from '@grafana/schema';
import { preparePlotConfigBuilder } from 'app/core/components/TimeSeries/utils';

import { getPanelProps } from '../test-utils';

import { TimeSeriesPanel } from './TimeSeriesPanel';
import { type Options } from './panelcfg.gen';

jest.mock('app/core/components/TimeSeries/utils', () => {
  const actual = jest.requireActual('app/core/components/TimeSeries/utils');
  return {
    ...actual,
    preparePlotConfigBuilder: jest.fn((...args: unknown[]) => actual.preparePlotConfigBuilder(...args)),
  };
});

const defaultOptions: Options = {
  legend: {
    showLegend: true,
    displayMode: LegendDisplayMode.List,
    placement: 'bottom',
    calcs: [],
  },
  tooltip: {
    mode: TooltipDisplayMode.Single,
    sort: SortOrder.None,
    maxWidth: 300,
    maxHeight: 300,
    hideZeros: false,
  },
};

const series = [
  createDataFrame({
    fields: [
      { name: 'time', type: FieldType.time, values: [1000, 2000, 3000], config: {} },
      { name: 'value', type: FieldType.number, values: [10, 20, 30], config: { custom: {} } },
    ],
  }),
];

const mockedPrepare = jest.mocked(preparePlotConfigBuilder);

describe('TimeSeriesPanel orientation', () => {
  beforeEach(() => {
    mockedPrepare.mockClear();
  });

  it.each([
    { name: 'omitted', orientation: undefined, expected: undefined },
    { name: 'auto', orientation: VizOrientation.Auto, expected: VizOrientation.Auto },
    { name: 'horizontal', orientation: VizOrientation.Horizontal, expected: VizOrientation.Horizontal },
    { name: 'vertical', orientation: VizOrientation.Vertical, expected: VizOrientation.Vertical },
  ])('passes $name orientation through to the plot config', ({ orientation, expected }) => {
    const options: Options = { ...defaultOptions };
    if (orientation !== undefined) {
      options.orientation = orientation;
    }

    const props = getPanelProps<Options>(options);
    props.data.series = series;

    render(<TimeSeriesPanel {...props} />);

    const orientations = mockedPrepare.mock.calls.map(([config]) => config.orientation);
    expect(orientations.length).toBeGreaterThan(0);
    expect(orientations).toEqual(Array(orientations.length).fill(expected));
  });
});
