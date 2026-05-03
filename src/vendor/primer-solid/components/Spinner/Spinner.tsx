import {
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  splitProps,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { VisuallyHidden } from '../VisuallyHidden'
import { useMedia } from '../../hooks'
import { mergeClassNames, mergeStyles } from '../../utils'
import styles from './Spinner.module.css'

const ANIMATION_DURATION_MS = 1000

const sizeMap = {
  small: '16px',
  medium: '32px',
  large: '64px',
} as const

type SpinnerOwnProps = {
  /** Sets the width and height of the spinner. */
  size?: keyof typeof sizeMap
  /** Sets the text conveyed by assistive technologies such as screen readers. Set to `null` if the loading state is displayed in a text node somewhere else on the page. */
  srText?: string | null
  /** @deprecated Use `srText` instead. */
  'aria-label'?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** Controls whether and how long to delay rendering the spinner. Set to `true` to delay by 1000ms, `'short'` to delay by 300ms, `'long'` to delay by 1000ms, or provide a custom number of milliseconds. */
  delay?: boolean | 'short' | 'long' | number
}

export type SpinnerProps = Omit<
  JSX.SvgSVGAttributes<SVGSVGElement>,
  keyof SpinnerOwnProps | 'children' | 'className'
> &
  SpinnerOwnProps

function getDelayDuration(delay: SpinnerProps['delay']) {
  if (typeof delay === 'number') return delay
  return delay === 'short' ? 300 : 1000
}

/**
 * Computes a negative animation-delay so all spinners land at the same
 * rotation angle regardless of when they mount.
 */
function computeSyncDelay(): number {
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  return -(now % ANIMATION_DURATION_MS)
}

export function Spinner(props: SpinnerProps) {
  const [local, rest] = splitProps(props, [
    'aria-label',
    'class',
    'className',
    'delay',
    'size',
    'srText',
    'style',
  ])
  const noMotionPreference = useMedia(
    '(prefers-reduced-motion: no-preference)',
    false,
  )
  const labelId = createUniqueId()
  const [isVisible, setIsVisible] = createSignal(!local.delay)
  const [syncDelay, setSyncDelay] = createSignal(!local.delay ? computeSyncDelay() : 0)

  createEffect(() => {
    const delay = local.delay

    if (!delay) return

    const timeoutId = window.setTimeout(() => {
      setSyncDelay(computeSyncDelay())
      setIsVisible(true)
    }, getDelayDuration(delay))

    onCleanup(() => {
      window.clearTimeout(timeoutId)
    })
  })

  const size = () => sizeMap[local.size ?? 'medium']
  const hasHiddenLabel = () =>
    local.srText !== null && local['aria-label'] === undefined
  const mergedStyle = () =>
    mergeStyles(
      local.style,
      noMotionPreference() ? { 'animation-delay': `${syncDelay()}ms` } : undefined,
    )

  return (
    <Show when={isVisible()}>
      <span class={styles.Box}>
        <svg
          {...rest}
          height={size()}
          width={size()}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden={true}
          aria-label={local['aria-label'] ?? undefined}
          aria-labelledby={hasHiddenLabel() ? labelId : undefined}
          class={mergeClassNames(
            local.className,
            local.class,
            styles.SpinnerAnimation,
          )}
          style={mergedStyle()}
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            stroke-opacity="0.25"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
          <path
            d="M15 8a7.002 7.002 0 0 0-7-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <Show when={hasHiddenLabel()}>
          <VisuallyHidden id={labelId}>{local.srText ?? 'Loading'}</VisuallyHidden>
        </Show>
      </span>
    </Show>
  )
}

Spinner.displayName = 'Spinner'

export default Spinner
