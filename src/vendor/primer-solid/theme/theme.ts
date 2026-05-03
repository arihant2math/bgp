export type ColorMode = 'day' | 'night' | 'auto'
export type ColorScheme = 'light' | 'dark'

export type Theme = {
  colorMode: ColorMode
  colorScheme?: ColorScheme
}

export const defaultTheme: Theme = {
  colorMode: 'day',
  colorScheme: 'light',
}

export function getColorScheme(colorMode: ColorMode): ColorScheme | undefined {
  if (colorMode === 'day') return 'light'
  if (colorMode === 'night') return 'dark'
  return undefined
}

export function getThemeAttributes(theme: Theme): {
  'data-color-mode': ColorMode
  'data-light-theme': 'light'
  'data-dark-theme': 'dark'
  'data-color-scheme': ColorScheme | undefined
} {
  const colorScheme = theme.colorScheme ?? getColorScheme(theme.colorMode)

  return {
    'data-color-mode': theme.colorMode,
    'data-light-theme': 'light',
    'data-dark-theme': 'dark',
    'data-color-scheme': colorScheme,
  }
}
