import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import type { ElementType, SxProp } from '../../types'

export type BoxProps<T extends ElementType = 'div'> = SxProp &
  JSX.HTMLAttributes<HTMLElement> & {
    as?: T
    children?: JSX.Element
  }

export function Box<T extends ElementType = 'div'>(props: BoxProps<T>) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'sx',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'div'}
      {...rest}
      class={mergeClassNames('PrimerSolid-Box', local.class)}
      style={mergeStyles(local.style, local.sx)}
    >
      {local.children}
    </Component>
  )
}
