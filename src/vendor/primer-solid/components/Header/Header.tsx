import { splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import styles from './Header.module.css'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type HeaderOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type HeaderProps<As extends ValidComponent = 'header'> =
  DistributiveOmit<ComponentProps<As>, keyof HeaderOwnProps<As>> &
    HeaderOwnProps<As>

export type HeaderItemProps = DistributiveOmit<
  ComponentProps<'div'>,
  'class' | 'className' | 'full'
> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  full?: boolean
}

type Pathname = string

type Location<State = unknown> = {
  pathname: string
  search?: string
  hash?: string
  state?: State
  key?: string
}

type HeaderLinkOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  to?: Location | Pathname
}

export type HeaderLinkProps<As extends ValidComponent = 'a'> =
  DistributiveOmit<ComponentProps<As>, keyof HeaderLinkOwnProps<As>> &
    HeaderLinkOwnProps<As>

function HeaderRoot<As extends ValidComponent = 'header'>(
  props: HeaderProps<As>,
) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'header'}
      class={mergeClassNames(local.className, local.class, styles.Header)}
      {...rest}
    >
      {local.children}
    </Component>
  )
}

function HeaderItem(props: HeaderItemProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'full',
  ])

  return (
    <div
      class={mergeClassNames(local.className, local.class, styles.HeaderItem)}
      data-full={local.full ? true : undefined}
      {...rest}
    >
      {local.children}
    </div>
  )
}

function HeaderLink<As extends ValidComponent = 'a'>(
  props: HeaderLinkProps<As>,
) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'a'}
      class={mergeClassNames(local.className, local.class, styles.HeaderLink)}
      {...rest}
    >
      {local.children}
    </Component>
  )
}

HeaderRoot.displayName = 'Header'
HeaderItem.displayName = 'Header.Item'
HeaderLink.displayName = 'Header.Link'

export const Header = Object.assign(HeaderRoot, {
  Item: HeaderItem,
  Link: HeaderLink,
})

export default Header
