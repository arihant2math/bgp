import { createContext, createMemo, splitProps, useContext } from 'solid-js'
import type { JSX } from 'solid-js'
import { defaultTheme, getThemeAttributes } from '../../theme'
import type { ColorMode, ColorScheme, Theme } from '../../theme'
import { mergeClassNames, mergeStyles } from '../../utils'

type ThemeProviderOwnProps = {
  children?: JSX.Element
  colorMode?: ColorMode
  colorScheme?: ColorScheme
}

export type ThemeProviderProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  keyof ThemeProviderOwnProps
> &
  ThemeProviderOwnProps

const ThemeContext = createContext<() => Theme>(() => defaultTheme)

export function useTheme() {
  return useContext(ThemeContext)()
}

export function ThemeProvider(props: ThemeProviderProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'colorMode',
    'colorScheme',
    'class',
    'style',
  ])

  const theme = createMemo<Theme>(() => ({
    colorMode: local.colorMode ?? defaultTheme.colorMode,
    colorScheme: local.colorScheme,
  }))

  return (
    <ThemeContext.Provider value={theme}>
      <div
        {...getThemeAttributes(theme())}
        {...(rest as JSX.HTMLAttributes<HTMLDivElement>)}
        class={mergeClassNames('PrimerSolid-ThemeProvider', local.class)}
        style={mergeStyles(
          {
            color: 'var(--fgColor-default)',
            'background-color': 'var(--bgColor-default)',
          },
          local.style,
        )}
      >
        {local.children}
      </div>
    </ThemeContext.Provider>
  )
}
