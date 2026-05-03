import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import styles from './BaseStyles.module.css'

export type BaseStylesProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element
}

export function BaseStyles(props: BaseStylesProps) {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])

  return (
    <div
      {...rest}
      class={mergeClassNames(styles.BaseStyles, local.class)}
      style={mergeStyles(local.style)}
    >
      {local.children}
    </div>
  )
}
