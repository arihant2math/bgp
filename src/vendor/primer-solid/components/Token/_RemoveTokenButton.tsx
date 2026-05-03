import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import { defaultTokenSize, type TokenSizeKeys } from './TokenBase'
import styles from './_RemoveTokenButton.module.css'

interface TokenButtonProps {
  borderOffset?: number
  size?: TokenSizeKeys
  isParentInteractive?: boolean
}

type RemoveTokenButtonProps = TokenButtonProps &
  Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'size'> &
  Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
    className?: string
  }

function XIcon(props: { size: 12 | 16 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={props.size}
      height={props.size}
      fill="currentColor"
    >
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function RemoveTokenButton(props: RemoveTokenButtonProps) {
  const [local, rest] = splitProps(props, [
    'aria-label',
    'borderOffset',
    'children',
    'class',
    'className',
    'isParentInteractive',
    'size',
    'style',
  ])

  const size = () => local.size ?? defaultTokenSize
  const iconSize = () => (size() === 'small' || size() === 'medium' ? 12 : 16)
  const style = () =>
    mergeStyles(
      {
        transform: `translate(${local.borderOffset ?? 0}px, -${local.borderOffset ?? 0}px)`,
      },
      local.style,
    )

  if (local.isParentInteractive) {
    return (
      <span
        {...(rest as JSX.HTMLAttributes<HTMLSpanElement>)}
        tabIndex={-1}
        aria-label={local['aria-label']}
        data-size={size()}
        class={mergeClassNames(
          styles.TokenButton,
          local.className,
          local.class,
        )}
        style={style()}
      >
        <XIcon size={iconSize()} />
      </span>
    )
  }

  return (
    <button
      {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
      aria-label="Remove token"
      data-size={size()}
      class={mergeClassNames(styles.TokenButton, local.className, local.class)}
      style={style()}
      type="button"
    >
      <XIcon size={iconSize()} />
    </button>
  )
}

export default RemoveTokenButton
