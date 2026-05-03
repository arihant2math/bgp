import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  splitProps,
  type Component,
  type JSX,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import { Text } from '../Text'
import { VisuallyHidden } from '../VisuallyHidden'
import { CharacterCounter } from './character-counter'
import styles from './TextInput.module.css'

type Ref<T> = ((element: T) => void) | { current?: T | null } | undefined

type TextInputSize = 'small' | 'medium' | 'large'
type LoaderPosition = 'auto' | 'leading' | 'trailing'
type FormValidationStatus = 'error' | 'success'
type VisualProp = JSX.Element | Component<any>
type TooltipDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
type ActionVariant = 'default' | 'primary' | 'invisible' | 'danger'

function assignRef<T>(ref: Ref<T>, element: T) {
  if (typeof ref === 'function') {
    ref(element)
  } else if (ref) {
    ref.current = element
  }
}

function callHandler(handler: unknown, event: Event) {
  if (!handler) return

  if (typeof handler === 'function') {
    ;(handler as (event: Event) => void)(event)
    return
  }

  const [fn, data] = handler as [(data: unknown, event: Event) => void, unknown]
  fn(data, event)
}

function toCssSize(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

function renderVisual(visual: VisualProp | undefined) {
  if (typeof visual === 'function') {
    return <Dynamic component={visual as Component<any>} />
  }

  return visual
}

function AlertFillIcon(props: { size?: number; class?: string }) {
  const size = () => props.size ?? 16

  return (
    <svg
      aria-hidden="true"
      class={props.class}
      viewBox="0 0 16 16"
      width={size()}
      height={size()}
      fill="currentColor"
    >
      <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l5.13 9.604A1.75 1.75 0 0 1 13.13 13.5H2.87a1.75 1.75 0 0 1-1.543-2.849ZM9 11.25a1 1 0 1 0-2 0 1 1 0 0 0 2 0ZM8 4.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 4.5Z" />
    </svg>
  )
}

function Spinner(props: { class?: string; size?: 'small' | 'medium' }) {
  return (
    <svg
      aria-hidden="true"
      class={mergeClassNames(
        styles.SpinnerSvg,
        props.size === 'small' && styles.SpinnerSvgSmall,
        props.class,
      )}
      viewBox="0 0 16 16"
      width="16"
      height="16"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        opacity="0.25"
        stroke="currentColor"
        stroke-width="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  )
}

export type TextInputNonPassthroughProps = {
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  /** @deprecated Use `leadingVisual` or `trailingVisual` instead. */
  icon?: VisualProp
  loading?: boolean
  loaderPosition?: LoaderPosition
  loaderText?: string
  leadingVisual?: VisualProp
  trailingVisual?: VisualProp
  trailingAction?: JSX.Element
  characterLimit?: number
  block?: boolean
  contrast?: boolean
  disabled?: boolean
  monospace?: boolean
  validationStatus?: FormValidationStatus
  /** @deprecated Use `size` instead. */
  variant?: TextInputSize
  size?: TextInputSize
  /** @deprecated Update width with CSS instead. */
  width?: string | number
  /** @deprecated Update min-width with CSS instead. */
  minWidth?: string | number
  /** @deprecated Update max-width with CSS instead. */
  maxWidth?: string | number
  defaultValue?: string | number | string[]
  ref?: Ref<HTMLInputElement>
}

export type TextInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | keyof TextInputNonPassthroughProps
  | 'children'
  | 'className'
  | 'prefix'
  | 'ref'
> &
  TextInputNonPassthroughProps

export type TextInputActionProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children' | 'prefix'
> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  'aria-label'?: string
  tooltipDirection?: TooltipDirection
  icon?: Component<any>
  variant?: ActionVariant
  ref?: Ref<HTMLButtonElement>
}

type TextInputInnerVisualSlotProps = {
  visual?: VisualProp
  hasLoadingIndicator: boolean
  showLoadingIndicator?: boolean
  visualPosition: 'leading' | 'trailing'
  id?: string
  componentPrefix?: string
  ['data-testid']?: string
}

function TextInputInnerVisualSlot(props: TextInputInnerVisualSlotProps) {
  const [local, rest] = splitProps(props, [
    'componentPrefix',
    'hasLoadingIndicator',
    'id',
    'showLoadingIndicator',
    'visual',
    'visualPosition',
  ])
  const componentPrefix = () => local.componentPrefix ?? 'TextInput'
  const isLeading = () => local.visualPosition === 'leading'

  if (
    (!local.visual && !local.hasLoadingIndicator) ||
    (isLeading() && !local.visual && !local.showLoadingIndicator)
  ) {
    return null
  }

  if (!local.hasLoadingIndicator) {
    return (
      <span
        {...rest}
        class="TextInput-icon"
        id={local.id}
        aria-hidden="true"
        data-component={
          isLeading()
            ? `${componentPrefix()}.LeadingVisual`
            : `${componentPrefix()}.TrailingVisual`
        }
      >
        {renderVisual(local.visual)}
      </span>
    )
  }

  return (
    <span
      {...rest}
      class="TextInput-icon"
      data-component={
        isLeading()
          ? `${componentPrefix()}.LeadingVisual`
          : `${componentPrefix()}.TrailingVisual`
      }
    >
      <div class={styles.VisualSlotBox} id={local.id}>
        <Show when={local.visual}>
          <div
            class={
              local.showLoadingIndicator
                ? styles.SpinnerHidden
                : styles.SpinnerVisible
            }
          >
            {renderVisual(local.visual)}
          </div>
        </Show>
        <Spinner
          size={local.visual ? undefined : 'small'}
          class={mergeClassNames(
            local.showLoadingIndicator
              ? styles.SpinnerVisible
              : styles.SpinnerHidden,
            !!local.visual && styles.SpinnerOverlay,
            !!local.visual && isLeading() && styles.SpinnerOverlayLeading,
          )}
        />
      </div>
    </span>
  )
}

function TextInputActionButton(props: TextInputActionProps) {
  const [local, rest] = splitProps(props, [
    'aria-label',
    'aria-labelledby',
    'children',
    'class',
    'className',
    'icon',
    'ref',
    'title',
    'tooltipDirection',
    'type',
    'variant',
  ])
  const variant = () => local.variant ?? 'invisible'
  const title = () =>
    local.children && local['aria-label']
      ? (local.title ?? local['aria-label'])
      : local.title

  return (
    <span
      class={mergeClassNames('TextInput-action', styles.TextInputAction)}
      data-component="TextInput.Action"
    >
      <button
        {...rest}
        ref={(element) => assignRef(local.ref, element)}
        type={local.type ?? 'button'}
        class={mergeClassNames(
          styles.ActionButton,
          variant() === 'invisible' && styles.Invisible,
          local.className,
          local.class,
        )}
        data-variant={variant()}
        aria-label={local.children ? undefined : local['aria-label']}
        aria-labelledby={local.children ? undefined : local['aria-labelledby']}
        title={title()}
      >
        <Show when={local.icon && !local.children}>
          <Dynamic
            component={local.icon as Component<any>}
            aria-hidden="true"
          />
        </Show>
        <Show when={local.children}>{local.children}</Show>
      </button>
    </span>
  )
}

function TextInputImpl(props: TextInputProps) {
  let inputElement: HTMLInputElement | undefined

  const [local, inputProps] = splitProps(props, [
    'aria-describedby',
    'aria-invalid',
    'block',
    'characterLimit',
    'class',
    'className',
    'contrast',
    'defaultValue',
    'disabled',
    'icon',
    'leadingVisual',
    'loaderPosition',
    'loaderText',
    'loading',
    'maxWidth',
    'minWidth',
    'monospace',
    'onBlur',
    'onChange',
    'onFocus',
    'onInput',
    'ref',
    'required',
    'size',
    'trailingAction',
    'trailingVisual',
    'type',
    'validationStatus',
    'value',
    'variant',
    'width',
  ])

  const [isInputFocused, setIsInputFocused] = createSignal(false)
  const [characterCount, setCharacterCount] = createSignal('')
  const [isOverLimit, setIsOverLimit] = createSignal(false)
  const [screenReaderMessage, setScreenReaderMessage] = createSignal('')

  const wrapperClasses = () =>
    mergeClassNames(local.className, local.class, 'TextInput-wrapper')
  const loaderPosition = () => local.loaderPosition ?? 'auto'
  const loaderText = () => local.loaderText ?? 'Loading'
  const type = () => local.type ?? 'text'
  const showLeadingLoadingIndicator = () =>
    Boolean(
      local.loading &&
      (loaderPosition() === 'leading' ||
        (local.leadingVisual && loaderPosition() !== 'trailing')),
    )
  const showTrailingLoadingIndicator = () =>
    Boolean(
      local.loading &&
      (loaderPosition() === 'trailing' ||
        (loaderPosition() === 'auto' && !local.leadingVisual)),
    )
  const isSegmentedInputType = () =>
    type() === 'date' || type() === 'time' || type() === 'datetime-local'

  const leadingVisualId = createUniqueId()
  const trailingVisualId = createUniqueId()
  const loadingId = createUniqueId()
  const characterCountId = createUniqueId()
  const characterCountStaticMessageId = createUniqueId()

  const inputDescribedBy = createMemo(() => {
    const ids = [
      local['aria-describedby'],
      local.leadingVisual && leadingVisualId,
      local.trailingVisual && trailingVisualId,
      local.loading && loadingId,
    ].filter(Boolean)

    return ids.length > 0 ? ids.join(' ') : undefined
  })

  let characterCounter: CharacterCounter | null = null
  let lastCountedLength: number | null = null

  createEffect(() => {
    const limit = local.characterLimit

    characterCounter?.cleanup()
    characterCounter = null
    lastCountedLength = null
    setCharacterCount('')
    setIsOverLimit(false)
    setScreenReaderMessage('')

    if (!limit) {
      return
    }

    characterCounter = new CharacterCounter({
      onCountUpdate: (_, overLimit, message) => {
        setCharacterCount(message)
        setIsOverLimit(overLimit)
      },
      onScreenReaderAnnounce: (message) => {
        setScreenReaderMessage(message)
      },
    })
  })

  createEffect(() => {
    const limit = local.characterLimit

    if (!limit || !characterCounter) return

    const currentValue =
      local.value !== undefined
        ? String(local.value)
        : local.defaultValue !== undefined
          ? String(local.defaultValue)
          : ''
    const currentLength = currentValue.length

    if (currentLength !== lastCountedLength) {
      lastCountedLength = currentLength
      characterCounter.updateCharacterCount(currentLength, limit)
    }
  })

  const isValid = createMemo<FormValidationStatus | undefined>(() =>
    isOverLimit() ? 'error' : local.validationStatus,
  )

  const mergedAriaInvalid = createMemo(() => {
    if (local['aria-invalid'] !== undefined) {
      return local['aria-invalid']
    }

    return isValid() === 'error' ? 'true' : undefined
  })

  const mergedAriaDescribedBy = createMemo(() => {
    if (local.characterLimit) {
      const ids = [characterCountStaticMessageId, inputDescribedBy()].filter(
        Boolean,
      )
      return ids.length > 0 ? ids.join(' ') : undefined
    }

    return inputDescribedBy()
  })

  const handleWrapperClick: JSX.EventHandlerUnion<
    HTMLSpanElement,
    MouseEvent
  > = (event) => {
    const target = event.target

    if (target instanceof HTMLElement && target.closest('button')) {
      return
    }

    if (target !== inputElement || !isSegmentedInputType()) {
      inputElement?.focus()
    }
  }

  const handleInputEvent: JSX.EventHandlerUnion<
    HTMLInputElement,
    InputEvent
  > = (event) => {
    if (local.characterLimit && characterCounter) {
      const currentLength = event.currentTarget.value.length

      if (currentLength !== lastCountedLength) {
        lastCountedLength = currentLength
        characterCounter.updateCharacterCount(
          currentLength,
          local.characterLimit,
        )
      }
    }

    callHandler(
      local.onInput,
      event as InputEvent & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )
    callHandler(
      local.onChange,
      event as unknown as Event & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )
  }

  const handleFocus: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    setIsInputFocused(true)
    callHandler(
      local.onFocus,
      event as FocusEvent & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )
  }

  const handleBlur: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    setIsInputFocused(false)
    callHandler(
      local.onBlur,
      event as FocusEvent & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )
  }

  return (
    <>
      <span
        class={mergeClassNames(
          styles.TextInputBaseWrapper,
          styles.TextInputWrapper,
          wrapperClasses(),
        )}
        data-block={local.block ? true : undefined}
        data-contrast={local.contrast ? true : undefined}
        data-disabled={local.disabled ? true : undefined}
        data-focused={isInputFocused() ? true : undefined}
        data-leading-visual={
          local.leadingVisual || showLeadingLoadingIndicator()
            ? true
            : undefined
        }
        data-monospace={local.monospace ? true : undefined}
        data-size={local.size}
        data-trailing-action={local.trailingAction ? true : undefined}
        data-trailing-visual={
          local.trailingVisual || showTrailingLoadingIndicator()
            ? true
            : undefined
        }
        data-validation={isValid()}
        data-variant={local.variant}
        data-component="TextInput"
        aria-busy={local.loading ? true : undefined}
        onClick={handleWrapperClick}
        style={mergeStyles(
          local.width !== undefined
            ? ({ width: toCssSize(local.width) } as JSX.CSSProperties)
            : undefined,
          local.minWidth !== undefined
            ? ({ minWidth: toCssSize(local.minWidth) } as JSX.CSSProperties)
            : undefined,
          local.maxWidth !== undefined
            ? ({ maxWidth: toCssSize(local.maxWidth) } as JSX.CSSProperties)
            : undefined,
        )}
      >
        <Show when={local.icon}>
          <span class="TextInput-icon" data-component="TextInput.Icon">
            {renderVisual(local.icon)}
          </span>
        </Show>
        <TextInputInnerVisualSlot
          visualPosition="leading"
          visual={local.leadingVisual}
          showLoadingIndicator={showLeadingLoadingIndicator()}
          hasLoadingIndicator={typeof local.loading === 'boolean'}
          id={leadingVisualId}
        />
        <input
          {...inputProps}
          ref={(element) => {
            inputElement = element
            assignRef(local.ref, element)
          }}
          class={styles.Input}
          disabled={local.disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInputEvent}
          type={type()}
          aria-required={local.required}
          aria-invalid={mergedAriaInvalid()}
          value={local.value ?? local.defaultValue}
          aria-describedby={mergedAriaDescribedBy()}
          data-component="input"
        />
        <Show when={local.loading}>
          <VisuallyHidden id={loadingId}>{loaderText()}</VisuallyHidden>
        </Show>
        <TextInputInnerVisualSlot
          visualPosition="trailing"
          visual={local.trailingVisual}
          showLoadingIndicator={showTrailingLoadingIndicator()}
          hasLoadingIndicator={typeof local.loading === 'boolean'}
          id={trailingVisualId}
          data-testid="text-input-trailing-visual"
        />
        <Show when={local.trailingAction}>{local.trailingAction}</Show>
      </span>
      <Show when={local.characterLimit}>
        <VisuallyHidden aria-live="polite" role="status">
          {screenReaderMessage()}
        </VisuallyHidden>
        <VisuallyHidden id={characterCountStaticMessageId}>
          You can enter up to {local.characterLimit}{' '}
          {local.characterLimit === 1 ? 'character' : 'characters'}
        </VisuallyHidden>
        <Text
          aria-hidden="true"
          id={characterCountId}
          size="small"
          class={mergeClassNames(
            styles.CharacterCounter,
            isOverLimit() && styles.CharacterCounterError,
          )}
          data-component="TextInput.CharacterCounter"
        >
          <Show when={isOverLimit()}>
            <AlertFillIcon size={16} />
          </Show>
          {characterCount()}
        </Text>
      </Show>
    </>
  )
}

export { TextInputActionButton as TextInputAction, TextInputImpl }
export default TextInputImpl
