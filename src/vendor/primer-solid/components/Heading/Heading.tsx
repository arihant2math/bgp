import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import type { SxProp } from '../../types'
import styles from './Heading.module.css'

export type HeadingSize = 'large' | 'medium' | 'small' | 'subhead'
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = SxProp &
  JSX.HTMLAttributes<HTMLHeadingElement> & {
    as?: `h${HeadingLevel}`
    children?: JSX.Element
    size?: HeadingSize
  }

const sizeClass: Record<HeadingSize, string> = {
  large: styles.HeadingLarge,
  medium: styles.HeadingMedium,
  small: styles.HeadingSmall,
  subhead: styles.HeadingSubhead,
}

export function Heading(props: HeadingProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'size',
    'style',
    'sx',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element
  const size = () => local.size ?? 'medium'

  return (
    <Component
      component={local.as ?? 'h2'}
      {...rest}
      class={mergeClassNames(styles.Heading, sizeClass[size()], local.class)}
      style={mergeStyles(local.style, local.sx)}
    >
      {local.children}
    </Component>
  )
}
