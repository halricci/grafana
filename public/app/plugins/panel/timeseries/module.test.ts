import { PanelOptionsEditorBuilder, standardEditorsRegistry } from '@grafana/data';
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
  it('registers the orientation radio defaulting to horizontal', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');

    expect(orientation?.defaultValue).toBe(VizOrientation.Horizontal);
  });

  it('offers auto, horizontal, and vertical orientation choices', () => {
    const orientation = buildItems().find((item) => item.path === 'orientation');
    const settings = orientation?.settings as { options: Array<{ value: VizOrientation }> };

    expect(settings.options.map((option) => option.value)).toEqual([
      VizOrientation.Auto,
      VizOrientation.Horizontal,
      VizOrientation.Vertical,
    ]);
  });
});
