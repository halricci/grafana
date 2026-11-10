import { getPanelOptionsWithDefaults, PanelOptionsEditorBuilder, standardEditorsRegistry } from '@grafana/data';
import { VizOrientation } from '@grafana/schema';
import { getAllOptionEditors } from 'app/core/components/OptionsUI/registry';

import { plugin } from './module';
import { type Options } from './panelcfg.gen';

standardEditorsRegistry.setInit(getAllOptionEditors);

function buildItems() {
  const builder = new PanelOptionsEditorBuilder<Options>();
  plugin.getPanelOptionsSupplier()(builder, { data: [] });
  return builder.getItems();
}

describe('time series panel options', () => {
  it('registers an orientation radio defaulting to horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
    expect(orientation?.category).toEqual(['Axis']);
    expect(orientation?.settings).toEqual({
      options: [
        { value: VizOrientation.Auto, label: 'Auto' },
        { value: VizOrientation.Horizontal, label: 'Horizontal' },
        { value: VizOrientation.Vertical, label: 'Vertical' },
      ],
    });
    expect(plugin.defaults).toMatchObject({ orientation: VizOrientation.Horizontal });
  });

  it('fills a missing orientation with horizontal and keeps an explicit vertical value', () => {
    const fieldConfig = { defaults: {}, overrides: [] };

    const omitted = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: {},
      currentFieldConfig: fieldConfig,
      isAfterPluginChange: false,
    });
    const vertical = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: { orientation: VizOrientation.Vertical },
      currentFieldConfig: fieldConfig,
      isAfterPluginChange: false,
    });

    expect(omitted.options.orientation).toBe(VizOrientation.Horizontal);
    expect(vertical.options.orientation).toBe(VizOrientation.Vertical);
  });
});
