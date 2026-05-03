import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import type { ElementType, SxProp } from '../../types'
import styles from './Stack.module.css'

export type StackDirection = 'vertical' | 'horizontal'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'
export type StackJustify = 'start' | 'center' | 'end' | 'between'
export type StackGap = 'none' | 'condensed' | 'normal' | 'spacious'

export type StackProps<T extends ElementType = 'div'> = SxProp &
  JSX.HTMLAttributes<HTMLElement> & {
    align?: StackAlign
    as?: T
    children?: JSX.Element
    direction?: StackDirection
    gap?: StackGap | number
    justify?: StackJustify
    wrap?: boolean
  }

const directionClass: Record<StackDirection, string> = {
  vertical: styles.StackVertical,
  horizontal: styles.StackHorizontal,
}

const alignClass: Record<StackAlign, string> = {
  start: styles.StackAlignStart,
  center: styles.StackAlignCenter,
  end: styles.StackAlignEnd,
  stretch: styles.StackAlignStretch,
}

const justifyClass: Record<StackJustify, string> = {
  start: styles.StackJustifyStart,
  center: styles.StackJustifyCenter,
  end: styles.StackJustifyEnd,
  between: styles.StackJustifyBetween,
}

const gapValue: Record<StackGap, string> = {
  none: '0',
  condensed: 'var(--base-size-4)',
  normal: 'var(--base-size-8)',
  spacious: 'var(--base-size-16)',
}

export function Stack<T extends ElementType = 'div'>(props: StackProps<T>) {
  const [local, rest] = splitProps(props, [
    'align',
    'as',
    'children',
    'class',
    'direction',
    'gap',
    'justify',
    'style',
    'sx',
    'wrap',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element
  const direction = () => local.direction ?? 'vertical'
  const align = () => local.align ?? 'stretch'
  const justify = () => local.justify ?? 'start'
  const gap = () =>
    typeof local.gap === 'number'
      ? `${local.gap}px`
      : gapValue[local.gap ?? 'normal']

  return (
    <Component
      component={local.as ?? 'div'}
      {...rest}
      class={mergeClassNames(
        styles.Stack,
        directionClass[direction()],
        alignClass[align()],
        justifyClass[justify()],
        local.wrap && styles.StackWrap,
        local.class,
      )}
      style={mergeStyles({ gap: gap() }, local.style, local.sx)}
    >
      {local.children}
    </Component>
  )
}
