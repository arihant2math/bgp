import { splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import styles from './Label.module.css'

export type LabelColorOptions =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'attention'
  | 'severe'
  | 'danger'
  | 'done'
  | 'sponsors'

type LabelSize = 'small' | 'large'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type LabelOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** The color of the label */
  variant?: LabelColorOptions
  /** How large the label is rendered */
  size?: LabelSize
}

export type LabelProps<As extends ValidComponent = 'span'> = DistributiveOmit<
  ComponentProps<As>,
  keyof LabelOwnProps<As>
> &
  LabelOwnProps<As>

export function Label<As extends ValidComponent = 'span'>(props: LabelProps<As>) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
    'size',
    'variant',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'span'}
      class={mergeClassNames(local.className, local.class, styles.Label)}
      data-size={local.size ?? 'small'}
      data-variant={local.variant ?? 'default'}
      {...rest}
    >
      {local.children}
    </Component>
  )
}

export default Label
