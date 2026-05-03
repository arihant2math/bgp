import { onMount, splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import styles from './Details.module.css'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type Ref<T> = ((element: T) => void) | { current?: T | null } | undefined

type DetailsOwnProps = {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  ref?: Ref<HTMLDetailsElement>
}

export type DetailsProps = DistributiveOmit<
  ComponentProps<'details'>,
  keyof DetailsOwnProps
> &
  DetailsOwnProps

type SummaryOwnProps<As extends ValidComponent> = {
  /** HTML element or Solid component to render the summary as. */
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type SummaryProps<As extends ValidComponent = 'summary'> =
  DistributiveOmit<ComponentProps<As>, keyof SummaryOwnProps<As>> &
    SummaryOwnProps<As>

function assignRef<T>(ref: Ref<T>, element: T) {
  if (typeof ref === 'function') {
    ref(element)
  } else if (ref) {
    ref.current = element
  }
}

function isDevelopment() {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV
  return env ? env !== 'production' : false
}

function DetailsRoot(props: DetailsProps) {
  let detailsRef: HTMLDetailsElement | undefined
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'ref',
  ])

  onMount(() => {
    if (!isDevelopment() || !detailsRef) return

    const summary = detailsRef.querySelector(
      'summary:not([data-default-summary])',
    )
    if (summary === null) {
      console.warn(
        'Warning:',
        'The <Details> component must have a <summary> child component. You can either use <Details.Summary> or a native <summary> element.',
      )
    }
  })

  return (
    <details
      {...rest}
      ref={(element) => {
        detailsRef = element
        assignRef(local.ref, element)
      }}
      class={mergeClassNames(local.className, local.class, styles.Details)}
    >
      {local.children}
    </details>
  )
}

function Summary<As extends ValidComponent = 'summary'>(
  props: SummaryProps<As>,
) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element
  const component = () => local.as ?? 'summary'

  return (
    <Component
      component={component()}
      as={component() === 'summary' ? undefined : 'summary'}
      class={mergeClassNames(local.className, local.class)}
      {...rest}
    >
      {local.children}
    </Component>
  )
}

DetailsRoot.displayName = 'Details'
Summary.displayName = 'Details.Summary'

export { Summary }

export const Details = Object.assign(DetailsRoot, {
  Summary,
})

export default Details
