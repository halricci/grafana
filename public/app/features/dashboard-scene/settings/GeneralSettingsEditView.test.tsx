import userEvent from '@testing-library/user-event';
import { render, screen } from 'test/test-utils';

import { type TimeOption } from '@grafana/data';
import { behaviors, SceneTimePicker, SceneTimeRange } from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';
import { type DashboardMeta } from 'app/types/dashboard';

import * as utils from '../pages/utils';
import { DashboardControls } from '../scene/DashboardControls';
import { DashboardScene } from '../scene/DashboardScene';
import { buildTimeSettingsSpec } from '../serialization/shared/timeSettings';
import { PERSONAL_TIME_RANGES_STORAGE_KEY, getPersonalTimeRangesSnapshot } from '../timepicker/personalTimeRanges';
import { activateFullSceneTree } from '../utils/test-utils';

import { GeneralSettingsEditView } from './GeneralSettingsEditView';

jest.mock('app/features/dashboard/components/GenAI/LazyGenAIButtons', () => ({
  LazyGenAIDashTitleButton: () => null,
  LazyGenAIDashDescriptionButton: () => null,
}));

describe('GeneralSettingsEditView', () => {
  describe('Dashboard state', () => {
    let dashboard: DashboardScene;
    let settings: GeneralSettingsEditView;

    beforeEach(async () => {
      const result = await buildTestScene();
      dashboard = result.dashboard;
      settings = result.settings;
    });

    it('should return the correct urlKey', () => {
      expect(settings.getUrlKey()).toBe('settings');
    });

    it('should return the dashboard', () => {
      expect(settings.getDashboard()).toBe(dashboard);
    });

    it('should return the dashboard time range', () => {
      expect(settings.getTimeRange()).toBe(dashboard.state.$timeRange);
    });

    it('should return the cursor sync', () => {
      expect(settings.getCursorSync()).toBe(dashboard.state.$behaviors?.[0]);
    });
  });

  describe('Dashboard updates', () => {
    let dashboard: DashboardScene;
    let settings: GeneralSettingsEditView;

    beforeEach(async () => {
      const result = await buildTestScene();
      dashboard = result.dashboard;
      settings = result.settings;
    });

    it('should have isDirty false', () => {
      expect(dashboard.state.isDirty).toBeFalsy();
    });

    it('A change to title updates the dashboard state', () => {
      settings.onTitleChange('new title');

      expect(dashboard.state.title).toBe('new title');
    });

    it('A change to description updates the dashboard state', () => {
      settings.onDescriptionChange('new description');

      expect(dashboard.state.description).toBe('new description');
    });

    it('A change to description updates the dashboard state', () => {
      settings.onTagsChange(['tag1', 'tag2']);

      expect(dashboard.state.tags).toEqual(['tag1', 'tag2']);
    });

    it('A change to editable permissions updates the dashboard state', () => {
      settings.onEditableChange(false);

      expect(dashboard.state.editable).toBe(false);
    });

    it('A change to timezone updates the dashboard state', () => {
      settings.onTimeZoneChange('UTC');
      expect(dashboard.state.$timeRange?.state.timeZone).toBe('UTC');
    });

    it('A change to week start updates the dashboard state', () => {
      settings.onWeekStartChange('monday');

      expect(settings.getTimeRange().state.weekStart).toBe('monday');
    });

    it('A change to refresh interval updates the dashboard state', () => {
      settings.onRefreshIntervalChange(['5s']);
      expect(settings.getRefreshPicker()?.state?.intervals).toEqual(['5s']);
    });

    it('A change to folder updates the dashboard state', async () => {
      const updateNavModel = jest.spyOn(utils, 'updateNavModel').mockImplementation(jest.fn());

      await settings.onFolderChange('folder-2', 'folder 2');

      expect(dashboard.state.meta.folderUid).toBe('folder-2');
      expect(dashboard.state.meta.folderTitle).toBe('folder 2');
      expect(updateNavModel).toHaveBeenCalledWith('folder-2');
    });

    it('A change to tooltip settings updates the dashboard state', () => {
      settings.onTooltipChange(DashboardCursorSync.Crosshair);

      expect(settings.getCursorSync()?.state.sync).toBe(DashboardCursorSync.Crosshair);
    });

    it('A change to time picker visiblity settings updates the dashboard state', () => {
      settings.onHideTimePickerChange(true);

      expect(settings.getDashboardControls()?.state.hideTimeControls).toBe(true);
    });
  });

  describe('Folder field visibility', () => {
    it('renders the Folder field for a normal dashboard', async () => {
      const { settings } = await buildTestScene();
      render(<settings.Component model={settings} />);
      expect(await screen.findByText('Folder')).toBeInTheDocument();
    });

    it('says this dashboard uses the standard ranges when it has no quick ranges of its own', async () => {
      localStorage.removeItem(PERSONAL_TIME_RANGES_STORAGE_KEY);
      const { settings } = await buildTestScene();
      render(<settings.Component model={settings} />);

      expect(
        await screen.findByText(
          'This dashboard has no quick ranges of its own. The time picker shows the standard ranges next to yours.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('No saved ranges yet.')).toBeInTheDocument();
      expect(
        screen.getByText(
          'These ranges are saved in this browser and show up on every dashboard you open. Saving or removing one does not change this dashboard.'
        )
      ).toBeInTheDocument();
      expect(screen.queryByText('Last 5 minutes')).not.toBeInTheDocument();
    });

    it('saving or removing a personal range leaves the dashboard time settings unchanged', async () => {
      const user = userEvent.setup();
      const quickRanges: TimeOption[] = [{ from: 'now-6h', to: 'now', display: 'Last 6 hours' }];
      localStorage.setItem(
        PERSONAL_TIME_RANGES_STORAGE_KEY,
        JSON.stringify([{ from: 'now-2h', to: 'now', display: 'Last 2 hours' }])
      );
      const history = '[{"from":"2020-01-01T00:00:00.000Z","to":"2020-01-02T00:00:00.000Z"}]';
      localStorage.setItem('grafana.dashboard.timepicker.history', history);

      const { dashboard, settings } = await buildTestScene({}, { from: 'now-15m', to: 'now', quickRanges });
      const timePicker = dashboard.state.controls?.state.timePicker;
      const timeZone = dashboard.state.$timeRange?.state.timeZone;
      const timeRange = dashboard.state.$timeRange!;
      const controls = dashboard.state.controls!;
      render(<settings.Component model={settings} />);

      expect(await screen.findByText('Last 6 hours')).toBeInTheDocument();
      const savedTimeSettings = buildTimeSettingsSpec(timeRange, controls);
      expect(
        screen.getByText(
          'Quick ranges attached to this dashboard. They stay on the dashboard when you change your ranges.'
        )
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Save current range' }));
      await user.click(screen.getByRole('button', { name: 'Remove Last 2 hours' }));

      expect(getPersonalTimeRangesSnapshot()).toEqual([{ from: 'now-15m', to: 'now', display: 'Last 15 minutes' }]);
      expect(screen.getByText('Last 15 minutes')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove Last 2 hours' })).not.toBeInTheDocument();
      expect(timePicker?.state.quickRanges).toBe(quickRanges);
      expect(buildTimeSettingsSpec(timeRange, controls)).toEqual(savedTimeSettings);
      expect(dashboard.state.$timeRange?.state.from).toBe('now-15m');
      expect(dashboard.state.$timeRange?.state.to).toBe('now');
      expect(dashboard.state.$timeRange?.state.timeZone).toBe(timeZone);
      expect(localStorage.getItem('grafana.dashboard.timepicker.history')).toBe(history);
    });

    it('hides the Folder field when the dashboard is a template', async () => {
      const { settings } = await buildTestScene({ canEdit: true, isDashboardTemplate: true });
      render(<settings.Component model={settings} />);

      // Other labels still render
      expect(await screen.findByText('Tags')).toBeInTheDocument();
      // Folder field is gone
      expect(screen.queryByText('Folder')).not.toBeInTheDocument();
    });
  });
});

async function buildTestScene(
  metaOverrides: Partial<DashboardMeta> = {},
  time?: { from: string; to: string; quickRanges?: TimeOption[] }
) {
  const settings = new GeneralSettingsEditView({});
  const dashboard = new DashboardScene({
    $timeRange: new SceneTimeRange(time ? { from: time.from, to: time.to } : {}),
    $behaviors: [new behaviors.CursorSync({ sync: DashboardCursorSync.Off }), new behaviors.LiveNowTimer({})],
    controls: new DashboardControls(
      time?.quickRanges ? { timePicker: new SceneTimePicker({ quickRanges: time.quickRanges }) } : {}
    ),
    title: 'hello',
    uid: 'dash-1',
    meta: {
      canEdit: true,
      ...metaOverrides,
    },
    editview: settings,
  });

  activateFullSceneTree(dashboard);

  await new Promise((r) => setTimeout(r, 1));

  dashboard.onEnterEditMode();
  settings.activate();

  return { dashboard, settings };
}
