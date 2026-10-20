import { getContrastRatio } from './colorManipulator';
import { createTheme } from './createTheme';
import { getThemeById } from './registry';

describe('createTheme', () => {
  it('create custom theme', () => {
    const custom = createTheme({
      colors: {
        mode: 'dark',
        primary: {
          main: 'rgb(240,0,0)',
        },
        background: {
          canvas: '#123',
        },
      },
    });

    expect(custom.colors.primary.main).toBe('rgb(240,0,0)');
    expect(custom.colors.primary.shade).toBe('rgb(242, 38, 38)');
    expect(custom.colors.background.canvas).toBe('#123');
  });

  it('create default theme', () => {
    const theme = createTheme();
    expect(theme.colors.mode).toBe('dark');
  });

  it('deep-merges component overrides on top of the defaults', () => {
    const theme = createTheme({
      components: {
        height: { sm: 99 },
      },
    });

    // overridden value is applied
    expect(theme.components.height.sm).toBe(99);
    // sibling defaults are preserved by the deep merge
    expect(theme.components.height.md).toBe(4);
    expect(theme.components.height.lg).toBe(6);
  });

  it('replaces tag colors wholesale rather than merging by index', () => {
    const theme = createTheme({
      components: {
        tag: {
          colors: [{ background: '#fff', text: '#000' }],
        },
      },
    });

    expect(theme.components.tag.colors).toEqual([{ background: '#fff', text: '#000' }]);
  });

  it.each([
    ['blue', 'Blue', '#3D7EFF', '#0E1A33'],
    ['pink', 'Pink', '#FF4FA3', '#1A1020'],
  ])('registers the %s extra theme', (themeId, name, primary, canvas) => {
    const theme = getThemeById(themeId);

    expect(theme.name).toBe(name);
    expect(theme.isDark).toBe(true);
    expect(theme.colors.primary.main).toBe(primary);
    expect(theme.colors.accent.main).toBe(primary);
    expect(theme.colors.background.canvas).toBe(canvas);
  });

  it.each(['visual_refresh_dark', 'visual_refresh_light'])(
    'meets code editor contrast requirements for %s',
    (themeId) => {
      const theme = getThemeById(themeId);

      for (const background of [theme.components.input.background, theme.colors.background.secondary]) {
        for (const color of Object.values(theme.components.codeEditor)) {
          expect(getContrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  );
});
