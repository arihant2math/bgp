import { createUniqueId, onMount, splitProps } from 'solid-js'
import type { JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import { CounterLabel } from '../CounterLabel'
import { Spinner } from '../Spinner'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './ButtonBase.module.css'
import type { ButtonBaseProps, ButtonVisual, Ref } from './types'

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

function renderVisualContent(visual: ButtonVisual) {
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  if (typeof visual === 'function') {
    return <Component component={visual as ValidComponent} />
  }

  return visual as JSX.Element
}

function renderModuleVisual(
  visual: ButtonVisual,
  loading: boolean,
  visualName: string,
  counterLabel: boolean,
) {
  return (
    <span
      data-component={visualName}
      class={mergeClassNames(
        !counterLabel && styles.Visual,
        loading ? styles.LoadingSpinner : styles.VisualWrap,
      )}
    >
      {loading ? <Spinner size="small" /> : renderVisualContent(visual)}
    </span>
  )
}

function ConditionalWrapper(props: {
  if: boolean
  class?: string
  children: JSX.Element
}) {
  if (!props.if) return <>{props.children}</>

  return (
    <div class={props.class} data-loading-wrapper>
      {props.children}
    </div>
  )
}

export function ButtonBase<As extends ValidComponent = 'button'>(
  props: ButtonBaseProps<As>,
) {
  let innerRef: Element | undefined
  const [local, rest] = splitProps(props as ButtonBaseProps<As>, [
    'alignContent',
    'aria-describedby',
    'aria-labelledby',
    'as',
    'block',
    'children',
    'class',
    'className',
    'count',
    'icon',
    'id',
    'inactive',
    'labelWrap',
    'leadingVisual',
    'loading',
    'loadingAnnouncement',
    'onClick',
    'ref',
    'size',
    'style',
    'trailingAction',
    'trailingVisual',
    'variant',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  const uuid = local.id ?? createUniqueId()
  const loadingAnnouncementId = () => `${uuid}-loading-announcement`
  const labelId = () => `${uuid}-label`
  const component = () => local.as ?? 'button'
  const variant = () => local.variant ?? 'default'
  const size = () => local.size ?? 'medium'
  const alignContent = () => local.alignContent ?? 'center'
  const loadingAnnouncement = () => local.loadingAnnouncement ?? 'Loading'
  const shouldWrapForLoading = () => typeof local.loading !== 'undefined'
  const wrapperClass = () =>
    local.block
      ? styles.ConditionalWrapper
      : variant() === 'link'
        ? styles.ConditionalWrapperLink
        : undefined
  const mergedAriaDescribedBy = () =>
    [local.loading ? loadingAnnouncementId() : undefined, local['aria-describedby']]
      .filter(Boolean)
      .join(' ') || undefined
  const mergedAriaLabelledBy = () =>
    local.loading
      ? [labelId(), local['aria-labelledby']].filter(Boolean).join(' ') ||
        undefined
      : local['aria-labelledby']

  onMount(() => {
    if (
      !isDevelopment() ||
      !innerRef ||
      innerRef instanceof HTMLButtonElement ||
      innerRef instanceof HTMLAnchorElement ||
      innerRef.tagName === 'SUMMARY'
    ) {
      return
    }

    console.warn(
      'This component should be an instanceof a semantic button or anchor',
    )
  })

  return (
    <ConditionalWrapper if={shouldWrapForLoading()} class={wrapperClass()}>
      <>
        <Component
          component={component()}
          aria-disabled={local.loading ? true : undefined}
          data-component="Button"
          {...(rest as Record<string, unknown>)}
          ref={(element: unknown) => {
            innerRef = element instanceof Element ? element : undefined
            assignRef(local.ref as Ref<unknown>, element)
          }}
          class={mergeClassNames(styles.ButtonBase, local.className, local.class)}
          style={mergeStyles(local.style)}
          data-block={local.block ? 'block' : undefined}
          data-inactive={local.inactive ? true : undefined}
          data-loading={String(Boolean(local.loading))}
          data-no-visuals={
            !local.leadingVisual && !local.trailingVisual && !local.trailingAction
              ? true
              : undefined
          }
          data-size={size()}
          data-variant={variant()}
          data-label-wrap={local.labelWrap ? true : undefined}
          data-has-count={local.count !== undefined ? true : undefined}
          aria-describedby={mergedAriaDescribedBy()}
          aria-labelledby={mergedAriaLabelledBy()}
          id={local.id}
          onClick={local.loading ? undefined : local.onClick}
        >
          {local.icon ? (
            local.loading ? (
              <Spinner size="small" />
            ) : (
              renderVisualContent(local.icon)
            )
          ) : (
            <>
              <span
                data-component="buttonContent"
                data-align={alignContent()}
                class={styles.ButtonContent}
              >
                {local.loading &&
                !local.leadingVisual &&
                !local.trailingVisual &&
                !local.trailingAction &&
                local.count === undefined
                  ? renderModuleVisual(Spinner, true, 'loadingSpinner', false)
                  : null}
                {local.leadingVisual
                  ? renderModuleVisual(
                      local.leadingVisual,
                      Boolean(local.loading),
                      'leadingVisual',
                      false,
                    )
                  : null}
                {local.children ? (
                  <span
                    data-component="text"
                    class={styles.Label}
                    id={local.loading ? labelId() : undefined}
                  >
                    {local.children}
                  </span>
                ) : null}
                {local.count !== undefined && !local.trailingVisual
                  ? renderModuleVisual(
                      <CounterLabel
                        className={styles.CounterLabel}
                        data-component="ButtonCounter"
                      >
                        {local.count}
                      </CounterLabel>,
                      Boolean(local.loading) && !local.leadingVisual,
                      'trailingVisual',
                      true,
                    )
                  : local.trailingVisual
                    ? renderModuleVisual(
                        local.trailingVisual,
                        Boolean(local.loading) && !local.leadingVisual,
                        'trailingVisual',
                        false,
                      )
                    : null}
              </span>
              {local.trailingAction
                ? renderModuleVisual(
                    local.trailingAction,
                    Boolean(local.loading) &&
                      !local.leadingVisual &&
                      !local.trailingVisual,
                    'trailingAction',
                    false,
                  )
                : null}
            </>
          )}
        </Component>
        {local.loading ? (
          <VisuallyHidden id={loadingAnnouncementId()} aria-live="polite" role="status">
            {loadingAnnouncement()}
          </VisuallyHidden>
        ) : null}
      </>
    </ConditionalWrapper>
  )
}

ButtonBase.displayName = 'ButtonBase'

export default ButtonBase
