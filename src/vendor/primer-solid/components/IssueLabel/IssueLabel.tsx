import { splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { readableColor } from 'color2k'
import { mergeClassNames, mergeStyles } from '../../utils'
import styles from './IssueLabel.module.css'

export type Hex = `#${string}`

export type LabelColorVariant =
  | 'auburn'
  | 'blue'
  | 'brown'
  | 'coral'
  | 'cyan'
  | 'gray'
  | 'green'
  | 'indigo'
  | 'lemon'
  | 'lime'
  | 'olive'
  | 'orange'
  | 'pine'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'red'
  | 'teal'
  | 'yellow'

export type IssueLabelBaseProps = {
  children?: JSX.Element
  class?: string
  className?: string
  fillColor?: Hex
  variant?: LabelColorVariant
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  IssueLabelBaseProps & {
    as?: never
    onClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
  }

type LinkProps = JSX.AnchorHTMLAttributes<HTMLAnchorElement> &
  IssueLabelBaseProps & {
    as?: never
    href: string
  }

type SpanProps = Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'onClick'> &
  IssueLabelBaseProps & {
    as?: never
    onClick?: never
    href?: never
  }

type IssueLabelAsProps<As extends ValidComponent> = {
  as: As
} & IssueLabelBaseProps &
  Omit<ComponentProps<As>, keyof IssueLabelBaseProps>

export type IssueLabelProps<As extends ValidComponent = 'span'> =
  | SpanProps
  | LinkProps
  | ButtonProps
  | IssueLabelAsProps<As>

export function IssueLabel(props: SpanProps): JSX.Element
export function IssueLabel(props: LinkProps): JSX.Element
export function IssueLabel(props: ButtonProps): JSX.Element
export function IssueLabel<As extends ValidComponent>(
  props: IssueLabelAsProps<As>,
): JSX.Element
export function IssueLabel<As extends ValidComponent>(
  props: IssueLabelProps<As>,
): JSX.Element {
  const [local, rest] = splitProps(props as IssueLabelProps, [
    'as',
    'children',
    'class',
    'className',
    'fillColor',
    'style',
    'variant',
  ])

  const component = () => {
    if (local.as) return local.as as ValidComponent
    if ('href' in props) return 'a'
    if ('onClick' in props) return 'button'
    return 'span'
  }
  const isDefaultButton = () => !local.as && component() === 'button'

  return (
    <Dynamic
      component={component()}
      {...(rest as Record<string, unknown>)}
      type={
        isDefaultButton() && !(rest as Record<string, unknown>).type
          ? 'button'
          : (rest as Record<string, unknown>).type
      }
      class={mergeClassNames(styles.IssueLabel, local.className, local.class)}
      data-variant={local.fillColor ? undefined : (local.variant ?? 'gray')}
      style={
        local.fillColor
          ? mergeStyles(local.style, {
              'background-color': local.fillColor,
              color: readableColor(local.fillColor),
            })
          : mergeStyles(local.style)
      }
    >
      {local.children}
    </Dynamic>
  )
}
