import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import type { SxProp } from '../../types'
import styles from './Avatar.module.css'

export type AvatarProps = SxProp &
  JSX.ImgHTMLAttributes<HTMLImageElement> & {
    size?: number
    square?: boolean
  }

export function Avatar(props: AvatarProps) {
  const [local, rest] = splitProps(props, [
    'alt',
    'class',
    'height',
    'size',
    'square',
    'style',
    'sx',
    'width',
  ])
  const size = () => local.size ?? 20

  return (
    <img
      {...rest}
      alt={local.alt ?? ''}
      height={local.height ?? size()}
      width={local.width ?? size()}
      class={mergeClassNames(
        styles.Avatar,
        !local.square && styles.AvatarCircle,
        local.class,
      )}
      style={mergeStyles(local.style, local.sx)}
    />
  )
}
