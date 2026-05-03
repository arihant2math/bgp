import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import styles from './SkeletonBox.module.css'

type CSSLength = JSX.CSSProperties['height'] | number

export type SkeletonBoxProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'class' | 'className' | 'height' | 'width'
> & {
  /** Height of the skeleton "box". Accepts any valid CSS `height` value. */
  height?: CSSLength
  /** Width of the skeleton "box". Accepts any valid CSS `width` value. */
  width?: CSSLength
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** Controls whether and how long to delay rendering the SkeletonBox. Set to 'short' to delay by 300ms, 'long' to delay by 1000ms, or provide a custom number of milliseconds. */
  delay?: 'short' | 'long' | number
}

function getDelayDuration(
  delay: Exclude<SkeletonBoxProps['delay'], undefined>,
) {
  if (typeof delay === 'number') return delay
  return delay === 'short' ? 300 : 1000
}

function toCssLength(value: CSSLength) {
  return typeof value === 'number' ? `${value}px` : value
}

function getDimensionStyles(
  height: SkeletonBoxProps['height'],
  width: SkeletonBoxProps['width'],
): JSX.CSSProperties | undefined {
  if (height === undefined && width === undefined) return undefined

  return {
    ...(height !== undefined ? { height: toCssLength(height) } : null),
    ...(width !== undefined ? { width: toCssLength(width) } : null),
  }
}

export function SkeletonBox(props: SkeletonBoxProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'delay',
    'height',
    'style',
    'width',
  ])
  const [isVisible, setIsVisible] = createSignal(!local.delay)

  createEffect(() => {
    const delay = local.delay

    if (delay) {
      const timeoutId = window.setTimeout(() => {
        setIsVisible(true)
      }, getDelayDuration(delay))

      onCleanup(() => window.clearTimeout(timeoutId))
    }
  })

  return (
    <Show when={isVisible()}>
      <div
        class={mergeClassNames(
          local.className,
          local.class,
          styles.SkeletonBox,
        )}
        style={mergeStyles(
          getDimensionStyles(local.height, local.width),
          local.style,
        )}
        {...rest}
      />
    </Show>
  )
}
