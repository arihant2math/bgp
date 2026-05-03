import { splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import styles from './Text.module.css'

export type TextSize = 'large' | 'medium' | 'small'
export type TextWeight = 'light' | 'normal' | 'medium' | 'semibold'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type TextOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  size?: TextSize
  weight?: TextWeight
}

export type TextProps<As extends ValidComponent = 'span'> = DistributiveOmit<
  ComponentProps<As>,
  keyof TextOwnProps<As>
> &
  TextOwnProps<As>

export function Text<As extends ValidComponent = 'span'>(props: TextProps<As>) {
  const [local, rest] = splitProps(props, [
    'as',
    'class',
    'className',
    'size',
    'weight',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'span'}
      class={mergeClassNames(local.className, local.class, styles.Text)}
      data-size={local.size}
      data-weight={local.weight}
      {...rest}
    />
  )
}
