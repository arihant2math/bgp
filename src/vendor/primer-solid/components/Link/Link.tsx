import { onMount, splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import type { SxProp } from '../../types'
import styles from './Link.module.css'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type Ref<T> = ((element: T) => void) | { current?: T | null } | undefined

type LinkOwnProps<As extends ValidComponent> = SxProp & {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** @deprecated use CSS modules to style hover color */
  hoverColor?: string
  inline?: boolean
  muted?: boolean
}

export type LinkProps<As extends ValidComponent = 'a'> = DistributiveOmit<
  ComponentProps<As>,
  keyof LinkOwnProps<As>
> &
  LinkOwnProps<As>

function assignRef<T>(ref: Ref<T>, element: T) {
  if (typeof ref === 'function') {
    ref(element)
  } else if (ref) {
    ref.current = element
  }
}

function isDevelopment() {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV
  return env ? env !== 'production' : false
}

function resolveHoverColor(hoverColor?: string) {
  if (!hoverColor) return undefined
  if (!hoverColor.includes('.')) return hoverColor

  const parts = hoverColor.split('.')
  if (parts.length === 2 && parts[0] === 'fg') {
    return `var(--fgColor-${parts[1]})`
  }

  if (parts.length === 2 && parts[1] === 'fg') {
    return `var(--fgColor-${parts[0]})`
  }

  return `var(--${hoverColor.replace(/\./g, '-')})`
}

export function Link<As extends ValidComponent = 'a'>(props: LinkProps<As>) {
  let linkRef: Element | undefined
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
    'hoverColor',
    'inline',
    'muted',
    'ref',
    'style',
    'sx',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  onMount(() => {
    if (
      !isDevelopment() ||
      !linkRef ||
      linkRef instanceof HTMLAnchorElement ||
      linkRef instanceof HTMLButtonElement
    ) {
      return
    }

    console.error(
      'Error: Found `Link` component that renders an inaccessible element',
      linkRef,
      'Please ensure `Link` always renders as <a> or <button>',
    )
  })

  return (
    <Component
      component={local.as ?? 'a'}
      {...rest}
      ref={(element: unknown) => {
        linkRef = element instanceof Element ? element : undefined
        assignRef(local.ref as Ref<unknown>, element)
      }}
      class={mergeClassNames(styles.Link, local.className, local.class)}
      data-component="Link"
      data-hover-color={local.hoverColor}
      data-inline={local.inline ? true : undefined}
      data-muted={local.muted ? true : undefined}
      style={mergeStyles(
        local.style,
        local.sx,
        local.hoverColor
          ? ({
              '--primer-solid-link-hoverColor': resolveHoverColor(
                local.hoverColor,
              ),
            } as JSX.CSSProperties)
          : undefined,
      )}
    >
      {local.children}
    </Component>
  )
}

export default Link
