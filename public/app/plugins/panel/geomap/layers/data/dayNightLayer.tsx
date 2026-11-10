import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Group as LayerGroup } from 'ol/layer';
import VectorImage from 'ol/layer/VectorImage';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Circle } from 'ol/style';
import DayNight from 'ol-ext/source/DayNight';
import { Subscription } from 'rxjs';

import { colorManipulator, type MapLayerRegistryItem, type PanelData } from '@grafana/data';

export enum ShowTime {
  From = 'from',
  To = 'to',
  Both = 'both',
}

// Lighten the range-start night so it stays distinct from the range-end fill where the two regions do not overlap.
const RANGE_START_LIGHTEN = 0.4;

function nightRegionStyle(color: string) {
  return new Style({
    fill: new Fill({ color }),
  });
}

// Configuration options for Circle overlays
export interface DayNightConfig {
  show: ShowTime;
  sun: boolean;
  nightColor: string;
}

const defaultConfig: DayNightConfig = {
  show: ShowTime.To,
  sun: false,
  nightColor: '#a7a6ba4D',
};

const DAY_NIGHT_LAYER_ID = 'dayNight';

/**
 * Map layer configuration for circle overlay
 */
export const dayNightLayer: MapLayerRegistryItem<DayNightConfig> = {
  id: DAY_NIGHT_LAYER_ID,
  name: 'Night / Day',
  description: 'Show day and night regions',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param map
   * @param options
   * @param theme
   */
  create: async (_map, options, _eventBus, theme) => {
    // Assert default values
    const config = {
      ...defaultConfig,
      ...options?.config,
    };

    // DayNight source for the selected time. "Both" keeps this region on the range end.
    const source = new DayNight({});
    const sourceMethods = Object.getPrototypeOf(source);
    const nightColor = theme.visualization.getColorByName(config.nightColor);

    // Night polygon
    const vectorLayer = new VectorImage({
      source,
      style: nightRegionStyle(nightColor),
    });

    // Second night polygon for the range start. Absent unless Show is Both, so saved From/To panels keep one region.
    const fromSource = config.show === ShowTime.Both ? new DayNight({}) : undefined;
    const fromLayer = fromSource
      ? new VectorImage({
          source: fromSource,
          style: nightRegionStyle(colorManipulator.lighten(nightColor, RANGE_START_LIGHTEN)),
        })
      : undefined;

    // Night line (for crosshair sharing)
    const nightLineLayer = new VectorImage({
      source: new VectorSource({
        features: [],
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#607D8B',
          width: 1.5,
          lineDash: [2, 3],
        }),
      }),
    });

    // Sun circle
    const sunFeature = new Feature({
      geometry: new Point([]),
    });

    const sunLayer = new VectorImage({
      source: new VectorSource({
        features: [sunFeature],
      }),
      style: new Style({
        image: new Circle({
          radius: 13,
          fill: new Fill({ color: 'rgb(253,184,19)' }),
        }),
      }),
    });

    // Sun line (for crosshair sharing)
    const sunLineFeature = new Feature({
      geometry: new Point([]),
    });

    const sunLineStyle = new Style({
      image: new Circle({
        radius: 13,
        stroke: new Stroke({
          color: 'rgb(253,184,19)',
          width: 1.5,
        }),
      }),
    });

    const sunLineStyleDash = new Style({
      image: new Circle({
        radius: 15,
        stroke: new Stroke({
          color: '#607D8B',
          width: 1.5,
          lineDash: [2, 3],
        }),
      }),
    });

    const sunLineLayer = new VectorImage({
      source: new VectorSource({
        features: [sunLineFeature],
      }),
      style: [sunLineStyleDash, sunLineStyle],
    });

    // Build group of layers. The range-start region is drawn under the range-end region.
    // TODO: add blended night region to "connect" current night region to lines
    const nightLayers = fromLayer ? [fromLayer, vectorLayer] : [vectorLayer];
    const layer = new LayerGroup({
      layers: config.sun ? [...nightLayers, sunLayer, sunLineLayer, nightLineLayer] : [...nightLayers, nightLineLayer],
    });

    // Crosshair sharing subscriptions
    const subscriptions = new Subscription();

    return {
      init: () => layer,
      dispose: () => subscriptions.unsubscribe(),
      update: (data: PanelData) => {
        const from = new Date(data.timeRange.from.valueOf());
        const to = new Date(data.timeRange.to.valueOf());
        // From uses the range start. To and Both keep the primary region (and the sun) on the range end.
        const primaryTime = config.show === ShowTime.From ? from : to;

        source.setTime(primaryTime);
        fromSource?.setTime(from);
        if (config.sun) {
          const sunPos = sourceMethods.getSunPosition(primaryTime);
          sunFeature.getGeometry()?.setCoordinates(fromLonLat(sunPos));
        }
      },

      // Marker overlay options
      registerOptionsUI: (builder) => {
        if (!options.config?.nightColor) {
          options.config = { ...defaultConfig, ...options.config };
        }

        builder.addRadio({
          path: 'config.show',
          name: 'Show',
          description: 'Night region at the start of the time range, the end, or both',
          settings: {
            options: [
              { label: 'From', value: ShowTime.From },
              { label: 'To', value: ShowTime.To },
              { label: 'Both', value: ShowTime.Both },
            ],
          },
          defaultValue: defaultConfig.show,
        });
        builder.addColorPicker({
          path: 'config.nightColor',
          name: 'Night region color',
          description: 'Pick color of night region',
          defaultValue: defaultConfig.nightColor,
          settings: [{ enableNamedColors: false }],
        });
        builder.addBooleanSwitch({
          path: 'config.sun',
          name: 'Display sun',
          description: 'Show the sun',
          defaultValue: defaultConfig.sun,
        });
      },
    };
  },

  // fill in the default values
  defaultOptions: defaultConfig,
};
