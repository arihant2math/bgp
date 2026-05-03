import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles, type StyleValue } from '../../utils'
import styles from './TokenBase.module.css'

export type TokenSizeKeys = 'small' | 'medium' | 'large' | 'xlarge'

export const tokenSizes: Record<TokenSizeKeys, string> = {
  small: '16px',
  medium: '20px',
  large: '24px',
  xlarge: '32px',
}

export const defaultTokenSize: TokenSizeKeys = 'medium'

export interface TokenBaseProps extends Omit<
  JSX.HTMLAttributes<HTMLElement> &
    JSX.AnchorHTMLAttributes<HTMLAnchorElement> &
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'id' | 'style' | 'size' | 'type'
> {
  as?: 'button' | 'a' | 'span'
  onRemove?: () => void
  hideRemoveButton?: boolean
  isSelected?: boolean
  text: JSX.Element
  id?: number | string
  size?: TokenSizeKeys
  disabled?: boolean
  className?: string
  style?: StyleValue
  type?: string
}

type InteractiveTokenProps = Pick<
  TokenBaseProps,
  'as' | 'disabled' | 'onClick' | 'onFocus' | 'tabIndex'
>

export const isTokenInteractive = ({
  as = 'span',
  onClick,
  onFocus,
  tabIndex = -1,
  disabled,
}: InteractiveTokenProps) => {
  if (disabled) return false

  return Boolean(
    onFocus ||
    onClick ||
    Number(tabIndex) > -1 ||
    as === 'a' ||
    as === 'button',
  )
}

function callEventHandler<T extends Event>(
  handler: JSX.EventHandlerUnion<HTMLElement, T> | undefined,
  event: T & { currentTarget: HTMLElement; target: Element },
) {
  if (!handler) return

  const eventHandler = handler as
    | ((event: T & { currentTarget: HTMLElement; target: Element }) => void)
    | [
        (
          data: unknown,
          event: T & { currentTarget: HTMLElement; target: Element },
        ) => void,
        unknown,
      ]

  if (Array.isArray(eventHandler)) {
    eventHandler[0](eventHandler[1], event)
    return
  }

  eventHandler(event)
}

export function TokenBase(props: TokenBaseProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
    'id',
    'isSelected',
    'onKeyDown',
    'onRemove',
    'size',
    'style',
  ])

  const component = () => local.as ?? 'span'
  const size = () => local.size ?? defaultTokenSize

  return (
    <Dynamic
      component={component()}
      {...(rest as Record<string, unknown>)}
      onKeyDown={(
        event: KeyboardEvent & {
          currentTarget: HTMLElement
          target: Element
        },
      ) => {
        callEventHandler(local.onKeyDown, event)

        if (
          (event.key === 'Backspace' || event.key === 'Delete') &&
          local.onRemove
        ) {
          local.onRemove()
        }
      }}
      class={mergeClassNames(styles.TokenBase, local.className, local.class)}
      data-cursor-is-interactive={isTokenInteractive({
        as: component(),
        onClick: rest.onClick,
        onFocus: rest.onFocus,
        tabIndex: rest.tabIndex,
        disabled: rest.disabled,
      })}
      data-size={size()}
      id={local.id?.toString()}
      style={mergeStyles(local.style)}
    >
      {local.children}
    </Dynamic>
  )
}

export default TokenBase
