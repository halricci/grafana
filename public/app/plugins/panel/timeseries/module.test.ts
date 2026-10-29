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

describe('timeseries module', () => {
  it('registers an always-visible orientation radio that defaults to Auto', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.editor).toBe(standardEditorsRegistry.get('radio').editor);
    expect(orientation?.showIf).toBeUndefined();
    expect(orientation?.defaultValue).toBe(VizOrientation.Auto);
    expect(orientation?.settings).toMatchObject({
      options: [
        { value: VizOrientation.Auto, label: 'Auto' },
        { value: VizOrientation.Horizontal, label: 'Horizontal' },
        { value: VizOrientation.Vertical, label: 'Vertical' },
      ],
    });
  });

  it('fills Auto for a saved dashboard that omits orientation and keeps an explicit value', () => {
    const omitted = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: {},
      currentFieldConfig: { defaults: {}, overrides: [] },
      isAfterPluginChange: false,
    });
    const explicit = getPanelOptionsWithDefaults({
      plugin,
      currentOptions: { orientation: VizOrientation.Vertical },
      currentFieldConfig: { defaults: {}, overrides: [] },
      isAfterPluginChange: false,
    });

    // Auto renders on the same horizontal time axis as a panel that never stored the option.
    expect(omitted.options.orientation).toBe(VizOrientation.Auto);
    expect(explicit.options.orientation).toBe(VizOrientation.Vertical);
  });
});
