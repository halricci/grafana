import { PanelOptionsEditorBuilder, standardEditorsRegistry, VizOrientation } from '@grafana/data';
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
  it('registers an orientation radio that defaults to Auto', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');
    const settings = orientation?.settings as { options?: Array<{ value: unknown }> } | undefined;

    expect(orientation?.editor).toBe(standardEditorsRegistry.get('radio').editor);
    expect(orientation?.showIf).toBeUndefined();
    expect(orientation?.defaultValue).toBe(VizOrientation.Auto);
    expect(settings?.options?.map((option) => option.value)).toEqual([
      VizOrientation.Auto,
      VizOrientation.Horizontal,
      VizOrientation.Vertical,
    ]);
    // The editor default is what saved panels pick up when the field is absent.
    expect(plugin.defaults.orientation).toBe(VizOrientation.Auto);
  });
});
