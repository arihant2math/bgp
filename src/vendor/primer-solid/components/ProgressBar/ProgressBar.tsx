import { children as resolveChildren, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import styles from './ProgressBar.module.css'

type ProgressProp = {
  progress?: string | number
  bg?: string
}

type StyledProgressContainerProps = {
  inline?: boolean
  barSize?: 'small' | 'default' | 'large'
  animated?: boolean
}

export type ProgressBarItemProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'className'
> & {
  'aria-label'?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
} & ProgressProp

export type ProgressBarProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'className'
> & {
  bg?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
} & StyledProgressContainerProps &
  ProgressProp

function countValidChildren(children: unknown): number {
  if (Array.isArray(children)) {
    let count = 0

    for (const child of children as unknown[]) {
      count += countValidChildren(child)
    }

    return count
  }

  return children === null ||
    children === undefined ||
    typeof children === 'boolean'
    ? 0
    : 1
}

function getProgressBarBg(bg?: string) {
  const bgType = bg && bg.split('.')

  return (
    (bgType && `var(--bgColor-${bgType[0]}-${bgType[1] || 'emphasis'})`) ||
    'var(--bgColor-success-emphasis)'
  )
}

export function Item(props: ProgressBarItemProps) {
  const [local, rest] = splitProps(props, [
    'aria-label',
    'aria-valuenow',
    'aria-valuetext',
    'bg',
    'class',
    'className',
    'progress',
    'style',
  ])
  const progressAsNumber =
    typeof local.progress === 'string'
      ? parseInt(local.progress, 10)
      : local.progress
  const ariaValueNow =
    local['aria-valuenow'] ??
    (progressAsNumber !== undefined && progressAsNumber >= 0
      ? Math.round(progressAsNumber)
      : 0)
  const style = {
    '--progress-width': local.progress ? `${local.progress}%` : '0%',
    '--progress-bg': getProgressBarBg(local.bg),
  }

  return (
    <span
      {...rest}
      role="progressbar"
      aria-label={local['aria-label']}
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={local['aria-valuetext']}
      class={mergeClassNames(
        local.className,
        local.class,
        styles.ProgressBarItem,
      )}
      style={mergeStyles(style, local.style)}
    />
  )
}

export function ProgressBarImpl(props: ProgressBarProps) {
  const [local, rest] = splitProps(props, [
    'animated',
    'aria-label',
    'aria-valuenow',
    'aria-valuetext',
    'barSize',
    'bg',
    'children',
    'class',
    'className',
    'inline',
    'progress',
  ])
  const resolvedChildren = resolveChildren(() => local.children)

  if (local.children && local.progress) {
    throw new Error('You should pass `progress` or children, not both.')
  }

  const validChildren = () => countValidChildren(resolvedChildren())

  return (
    <span
      {...rest}
      class={mergeClassNames(
        local.className,
        local.class,
        styles.ProgressBarContainer,
      )}
      data-progress-display={local.inline ? 'inline' : 'block'}
      data-progress-bar-size={local.barSize ?? 'default'}
    >
      {validChildren() ? (
        resolvedChildren()
      ) : (
        <Item
          data-animated={local.animated ? 'true' : undefined}
          progress={local.progress}
          aria-label={local['aria-label']}
          aria-valuenow={local['aria-valuenow']}
          aria-valuetext={local['aria-valuetext']}
          bg={local.bg ?? 'success.emphasis'}
        />
      )}
    </span>
  )
}

Item.displayName = 'ProgressBar.Item'
ProgressBarImpl.displayName = 'ProgressBar'

export default ProgressBarImpl
