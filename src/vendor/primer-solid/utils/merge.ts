import type { JSX } from 'solid-js'
import { clsx } from 'clsx'

export type StyleValue = JSX.CSSProperties | string | undefined

export function mergeClassNames(
  ...values: Array<string | false | null | undefined>
) {
  return clsx(values)
}

function toCssText(style: JSX.CSSProperties) {
  return Object.entries(style)
    .map(([property, value]) => {
      const cssProperty = property.replace(
        /[A-Z]/g,
        (match) => `-${match.toLowerCase()}`,
      )
      return `${cssProperty}: ${value}`
    })
    .join('; ')
}

export function mergeStyles(...values: Array<StyleValue>): StyleValue {
  const styles = values.filter(Boolean) as Array<JSX.CSSProperties | string>
  if (styles.length === 0) return undefined

  if (styles.some((style) => typeof style === 'string')) {
    return styles
      .map((style) => (typeof style === 'string' ? style : toCssText(style)))
      .join('; ')
  }

  return Object.assign({}, ...styles)
}
