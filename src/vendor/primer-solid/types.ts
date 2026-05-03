import type { JSX } from 'solid-js'

export type ElementType = keyof JSX.IntrinsicElements

export type ComponentProps<T extends ElementType> = JSX.IntrinsicElements[T]

export type ForwardedRef<T> = ((element: T) => void) | T | undefined

export type HTMLDataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type AriaAttributes = {
  [key: `aria-${string}`]: string | number | boolean | undefined
}

export type SxProp = {
  sx?: JSX.CSSProperties
}
