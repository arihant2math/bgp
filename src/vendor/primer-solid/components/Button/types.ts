import type { ComponentProps, JSX, ValidComponent } from 'solid-js'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

export type Ref<T> = ((element: T) => void) | { current?: T | null } | undefined

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'invisible'
  | 'danger'
  | 'link'

export type ButtonSize = 'small' | 'medium' | 'large'

export type AlignContent = 'start' | 'center'

export type ButtonVisual = JSX.Element | ValidComponent | null

type ButtonOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  ref?: Ref<unknown>
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  loadingAnnouncement?: string
  inactive?: boolean
  labelWrap?: boolean
  alignContent?: AlignContent
  icon?: ButtonVisual
  leadingVisual?: ButtonVisual
  trailingVisual?: ButtonVisual
  trailingAction?: ButtonVisual
  count?: number | string
}

export type ButtonBaseProps<As extends ValidComponent = 'button'> =
  DistributiveOmit<ComponentProps<As>, keyof ButtonOwnProps<As> | 'className'> &
    ButtonOwnProps<As>

export type ButtonProps<As extends ValidComponent = 'button'> =
  ButtonBaseProps<As>
