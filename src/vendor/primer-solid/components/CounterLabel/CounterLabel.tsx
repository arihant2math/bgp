import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames } from '../../utils'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './CounterLabel.module.css'

export type CounterLabelVariant = 'primary' | 'secondary'

export type CounterLabelProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children' | 'className'
> & {
  children?: JSX.Element
  className?: string
  /** @deprecated use variant instead */
  scheme?: CounterLabelVariant
  variant?: CounterLabelVariant
  /** @deprecated `CounterLabel` does not support the `sx` prop. */
  sx?: never
}

export function CounterLabel(props: CounterLabelProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'scheme',
    'sx',
    'variant',
  ])

  const inferredVariant = () => local.variant ?? local.scheme ?? 'secondary'

  return (
    <>
      <span
        aria-hidden="true"
        data-variant={inferredVariant()}
        {...rest}
        class={mergeClassNames(local.className, local.class, styles.CounterLabel)}
      >
        {local.children}
      </span>
      <VisuallyHidden>
        {'\u00a0'}({local.children})
      </VisuallyHidden>
    </>
  )
}

export default CounterLabel
