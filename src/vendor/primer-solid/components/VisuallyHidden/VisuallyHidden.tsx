import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames } from '../../utils'
import styles from './VisuallyHidden.module.css'

/**
 * Provides a component that implements the "visually hidden" technique. This is
 * analogous to the common `sr-only` class. Children that are rendered inside
 * this component will not be visible but will be available to screen readers.
 *
 * Note: if this component, or a descendant, has focus then this component will
 * no longer be visually hidden.
 *
 * @see https://www.scottohara.me/blog/2023/03/21/visually-hidden-hack.html
 */
export type VisuallyHiddenProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children' | 'className'
> & {
  children?: JSX.Element
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** @deprecated `VisuallyHidden` always renders a `span`. */
  as?: never
  /** @deprecated `VisuallyHidden` does not support the `sx` prop. */
  sx?: never
}

export function VisuallyHidden(props: VisuallyHiddenProps) {
  const [local, rest] = splitProps(
    props as VisuallyHiddenProps & { as?: unknown; sx?: unknown },
    ['as', 'children', 'class', 'className', 'sx'],
  )

  return (
    <span
      {...rest}
      class={mergeClassNames(styles.VisuallyHidden, local.className, local.class)}
    >
      {local.children}
    </span>
  )
}
