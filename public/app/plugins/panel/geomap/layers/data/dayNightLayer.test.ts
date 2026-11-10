import type OpenLayersMap from 'ol/Map';
import { Group as LayerGroup } from 'ol/layer';
import VectorImage from 'ol/layer/VectorImage';
import { toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';
import DayNight from 'ol-ext/source/DayNight';
import { Subscription } from 'rxjs';

import {
  createTheme,
  dateTime,
  EventBusSrv,
  LoadingState,
  type MapLayerOptions,
  type PanelData,
  type PanelOptionsEditorBuilder,
  type TimeRange,
} from '@grafana/data';

import { ensureInstanceOf } from '../test-utils';

import { type DayNightConfig, dayNightLayer, ShowTime } from './dayNightLayer';

const defaultConfig: DayNightConfig = {
  show: ShowTime.To,
  sun: false,
  nightColor: '#a7a6ba4D',
};

const from = dateTime('2024-06-01T00:00:00Z');
const to = dateTime('2024-06-01T12:00:00Z');
const timeRange: TimeRange = { from, to, raw: { from, to } };

const dataFor = (range: TimeRange): PanelData => ({
  state: LoadingState.Done,
  timeRange: range,
  series: [],
});

async function setup(config: Partial<DayNightConfig> = {}) {
  const options: MapLayerOptions<DayNightConfig> = {
    type: 'dayNight',
    name: 'Night / Day',
    config: { ...defaultConfig, ...config },
  };
  const handler = await dayNightLayer.create({} as OpenLayersMap, options, new EventBusSrv(), createTheme());
  const group = ensureInstanceOf(handler.init(), LayerGroup);
  const [nightLayer] = group.getLayers().getArray();
  return { handler, group, nightSource: ensureInstanceOf<VectorImage>(nightLayer, VectorImage).getSource()! };
}

describe('dayNightLayer', () => {
  it('offers From, To, and Both in the Show options', async () => {
    const options: MapLayerOptions<DayNightConfig> = {
      type: 'dayNight',
      name: 'Night / Day',
      config: { ...defaultConfig },
    };
    const handler = await dayNightLayer.create({} as OpenLayersMap, options, new EventBusSrv(), createTheme());
    let showOptions: Array<{ label: string; value: ShowTime }> = [];
    const builder = {
      addRadio: (config: { path: string; settings: { options: Array<{ label: string; value: ShowTime }> } }) => {
        if (config.path === 'config.show') {
          showOptions = config.settings.options;
        }
        return builder;
      },
      addColorPicker: () => builder,
      addBooleanSwitch: () => builder,
    };
    handler.registerOptionsUI!(builder as unknown as PanelOptionsEditorBuilder<MapLayerOptions<DayNightConfig>>);
    expect(showOptions).toEqual([
      { label: 'From', value: ShowTime.From },
      { label: 'To', value: ShowTime.To },
      { label: 'Both', value: ShowTime.Both },
    ]);
  });

  it('renders the night region and its crosshair line', async () => {
    const { group } = await setup();
    const layers = group.getLayers().getArray();
    expect(layers).toHaveLength(2);
    // the night region draws from the DayNight source; the crosshair line from a plain vector source
    expect(ensureInstanceOf<VectorImage>(layers[0], VectorImage).getSource()).toBeInstanceOf(DayNight);
    expect(ensureInstanceOf<VectorImage>(layers[1], VectorImage).getSource()).toBeInstanceOf(VectorSource);
  });

  it('adds the sun layers carrying the sun feature when the sun is enabled', async () => {
    const { group } = await setup({ sun: true });
    const layers = group.getLayers().getArray();
    expect(layers).toHaveLength(4);
    // the extra layers carry the sun overlay: a single Point feature
    const sunSource = ensureInstanceOf<VectorImage>(layers[1], VectorImage).getSource()!;
    expect(sunSource.getFeatures()).toHaveLength(1);
  });

  it('update() shows the night region at the end of the time range', async () => {
    const { handler, nightSource } = await setup({ show: ShowTime.To });
    handler.update!(dataFor(timeRange));
    expect(nightSource.get('time')).toEqual(new Date(to.valueOf()));
  });

  it('update() shows the night region at the start of the time range', async () => {
    const { handler, group, nightSource } = await setup({ show: ShowTime.From });
    // a saved From panel stays a single night region
    expect(group.getLayers().getArray()).toHaveLength(2);
    handler.update!(dataFor(timeRange));
    expect(nightSource.get('time')).toEqual(new Date(from.valueOf()));
  });

  it('update() draws the night region at both ends of the time range', async () => {
    const { handler, group } = await setup({ show: ShowTime.Both });
    const layers = group.getLayers().getArray();
    // lighter range-start region, range-end region, crosshair line
    expect(layers).toHaveLength(3);

    const startLayer = ensureInstanceOf<VectorImage>(layers[0], VectorImage);
    const endLayer = ensureInstanceOf<VectorImage>(layers[1], VectorImage);
    const startSource = startLayer.getSource()!;
    const endSource = endLayer.getSource()!;
    expect(startSource).toBeInstanceOf(DayNight);
    expect(endSource).toBeInstanceOf(DayNight);
    expect(startSource).not.toBe(endSource);

    // #a7a6ba4D lightened by 0.4, alpha kept. Frozen so a change in the fill math fails here.
    const startStyle = startLayer.getStyle();
    const endStyle = endLayer.getStyle();
    expect(startStyle).toBeInstanceOf(Style);
    expect(endStyle).toBeInstanceOf(Style);
    expect((startStyle as Style).getFill()!.getColor()).toBe('rgba(202, 201, 213, 0.302)');
    expect((endStyle as Style).getFill()!.getColor()).toBe('#a7a6ba4D');

    handler.update!(dataFor(timeRange));
    expect(startSource.get('time')).toEqual(new Date('2024-06-01T00:00:00Z'));
    expect(endSource.get('time')).toEqual(new Date('2024-06-01T12:00:00Z'));

    const nextFrom = dateTime('2024-06-02T03:30:00Z');
    const nextTo = dateTime('2024-06-02T18:45:00Z');
    handler.update!(dataFor({ from: nextFrom, to: nextTo, raw: { from: nextFrom, to: nextTo } }));
    expect(startSource.get('time')).toEqual(new Date('2024-06-02T03:30:00Z'));
    expect(endSource.get('time')).toEqual(new Date('2024-06-02T18:45:00Z'));
  });

  it('update() keeps the sun on the end of the range when both night regions are shown', async () => {
    const { handler, group } = await setup({ show: ShowTime.Both, sun: true });
    const layers = group.getLayers().getArray();
    expect(layers).toHaveLength(5);
    const sunFeature = ensureInstanceOf<VectorImage>(layers[2], VectorImage).getSource()!.getFeatures()[0];

    handler.update!(dataFor(timeRange));

    // same subsolar point as Show "To" for 2024-06-01T12:00:00Z
    const [lon, lat] = toLonLat(sunFeature.getGeometry()!.getCoordinates());
    expect(lon).toBeCloseTo(-0.5156, 3);
    expect(lat).toBeCloseTo(22.1567, 3);
  });

  it('update() moves the sun to the subsolar point for the selected time', async () => {
    const { handler, group } = await setup({ sun: true });
    const sunFeature = ensureInstanceOf<VectorImage>(group.getLayers().item(1), VectorImage)
      .getSource()!
      .getFeatures()[0];
    expect(sunFeature.getGeometry()!.getCoordinates()).toEqual([]);

    handler.update!(dataFor(timeRange));

    // deterministic for the fixed `to` time (2024-06-01T12:00:00Z): read back to lon/lat and freeze
    // the subsolar point (~noon at Greenwich, June declination ~+22°) so a change in the math fails here
    const [lon, lat] = toLonLat(sunFeature.getGeometry()!.getCoordinates());
    expect(lon).toBeCloseTo(-0.5156, 3);
    expect(lat).toBeCloseTo(22.1567, 3);
  });

  it('dispose() unsubscribes its crosshair subscriptions', async () => {
    const { handler } = await setup();
    const unsubscribe = jest.spyOn(Subscription.prototype, 'unsubscribe');
    handler.dispose!();
    expect(unsubscribe).toHaveBeenCalled();
    unsubscribe.mockRestore();
  });
});
