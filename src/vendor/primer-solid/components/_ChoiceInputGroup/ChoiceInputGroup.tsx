import { Show, children as resolveChildren, createMemo, createUniqueId, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames } from '../../utils'
import { assignRef, type RefProp } from '../../utils/solid'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './ChoiceInputGroup.module.css'

export type FormValidationStatus = 'error' | 'success'

export type ChoiceInputGroupProps = Omit<
  JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'className'
> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  'aria-labelledby'?: string
  required?: boolean
}

export type ChoiceInputGroupLabelProps = {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  visuallyHidden?: boolean
}

export type ChoiceInputGroupCaptionProps = {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type ChoiceInputGroupValidationProps = {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  variant: FormValidationStatus
}

type ChoiceInputGroupSlotType = 'label' | 'caption' | 'validation'

const CHOICE_INPUT_GROUP_SLOT = Symbol('primer-solid.choice-input-group-slot')

type ChoiceInputGroupSlot = {
  readonly [CHOICE_INPUT_GROUP_SLOT]: true
  type: ChoiceInputGroupSlotType
  props:
    | ChoiceInputGroupLabelProps
    | ChoiceInputGroupCaptionProps
    | ChoiceInputGroupValidationProps
}

function createChoiceInputGroupSlot(
  type: ChoiceInputGroupSlotType,
  props:
    | ChoiceInputGroupLabelProps
    | ChoiceInputGroupCaptionProps
    | ChoiceInputGroupValidationProps,
) {
  return {
    [CHOICE_INPUT_GROUP_SLOT]: true,
    type,
    props,
  } as ChoiceInputGroupSlot as unknown as JSX.Element
}

function isChoiceInputGroupSlot(value: unknown): value is ChoiceInputGroupSlot {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<ChoiceInputGroupSlot>)[CHOICE_INPUT_GROUP_SLOT] === true
  )
}

function AlertFillIcon(props: { class?: string }) {
  return (
    <svg
      aria-hidden="true"
      class={props.class}
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="currentColor"
    >
      <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l5.13 9.604A1.75 1.75 0 0 1 13.13 13.5H2.87a1.75 1.75 0 0 1-1.543-2.849ZM9 11.25a1 1 0 1 0-2 0 1 1 0 0 0 2 0ZM8 4.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 4.5Z" />
    </svg>
  )
}

function CheckCircleFillIcon(props: { class?: string }) {
  return (
    <svg
      aria-hidden="true"
      class={props.class}
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="currentColor"
    >
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16ZM6.78 11.03 3.97 8.22a.75.75 0 0 1 1.06-1.06l1.75 1.75 4.19-4.19a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0Z" />
    </svg>
  )
}

function ChoiceInputGroupLabelImpl(props: ChoiceInputGroupLabelProps) {
  return createChoiceInputGroupSlot('label', props)
}

function ChoiceInputGroupCaptionImpl(props: ChoiceInputGroupCaptionProps) {
  return createChoiceInputGroupSlot('caption', props)
}

function ChoiceInputGroupValidationImpl(props: ChoiceInputGroupValidationProps) {
  return createChoiceInputGroupSlot('validation', props)
}

function renderLabel(
  slot: ChoiceInputGroupSlot,
  required: boolean | undefined,
  disabled: boolean | undefined,
) {
  const props = slot.props as ChoiceInputGroupLabelProps
  const content = (
    <span class={styles.GroupLabelContent}>
      <span>{props.children}</span>
      <Show when={required}>
        <span aria-hidden="true">*</span>
      </Show>
    </span>
  )

  if (props.visuallyHidden) {
    return (
      <VisuallyHidden
        class={mergeClassNames(styles.GroupLabel, props.className, props.class)}
        title={required ? 'required field' : undefined}
        data-label-disabled={disabled ? true : undefined}
      >
        {content}
      </VisuallyHidden>
    )
  }

  return (
    <span
      class={mergeClassNames(styles.GroupLabel, props.className, props.class)}
      title={required ? 'required field' : undefined}
      data-label-disabled={disabled ? true : undefined}
    >
      {content}
    </span>
  )
}

function renderCaption(slot: ChoiceInputGroupSlot, id: string | undefined) {
  const props = slot.props as ChoiceInputGroupCaptionProps

  return (
    <span
      id={id}
      class={mergeClassNames(styles.GroupCaption, props.className, props.class)}
    >
      {props.children}
    </span>
  )
}

function renderValidation(
  slot: ChoiceInputGroupSlot,
  id: string | undefined,
  ariaHidden: boolean,
) {
  const props = slot.props as ChoiceInputGroupValidationProps
  const Icon = props.variant === 'success' ? CheckCircleFillIcon : AlertFillIcon

  return (
    <div
      id={id}
      class={mergeClassNames(styles.Validation, props.className, props.class)}
      data-validation-status={props.variant}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      <span class={styles.ValidationIcon}>
        <Icon />
      </span>
      <span class={styles.ValidationText}>{props.children}</span>
    </div>
  )
}

type ChoiceInputGroupRootProps = ChoiceInputGroupProps & {
  rootRef?: RefProp<HTMLFieldSetElement | HTMLDivElement>
}

export function ChoiceInputGroupRoot(props: ChoiceInputGroupRootProps) {
  const [local, rest] = splitProps(props, [
    'aria-labelledby',
    'children',
    'class',
    'className',
    'disabled',
    'id',
    'required',
    'rootRef',
  ])

  const resolvedChildren = resolveChildren(() => local.children)
  const generatedId = createUniqueId()

  const slots = createMemo(() => {
    let label: ChoiceInputGroupSlot | undefined
    let caption: ChoiceInputGroupSlot | undefined
    let validation: ChoiceInputGroupSlot | undefined
    const items: JSX.Element[] = []

    for (const child of resolvedChildren.toArray()) {
      if (!isChoiceInputGroupSlot(child)) {
        items.push(child)
        continue
      }

      if (child.type === 'label') {
        label = child
      } else if (child.type === 'caption') {
        caption = child
      } else if (child.type === 'validation') {
        validation = child
      }
    }

    return { label, caption, validation, items }
  })

  const groupId = () => local.id ?? generatedId
  const captionId = () => (slots().caption ? `${groupId()}-caption` : undefined)
  const validationId = () =>
    slots().validation ? `${groupId()}-validationMessage` : undefined
  const requiredMessageId = () =>
    local.required ? `${groupId()}-requiredMessage` : undefined
  const descriptionIds = () => {
    const ids = [validationId(), captionId(), requiredMessageId()].filter(Boolean)
    return ids.length > 0 ? ids.join(' ') : undefined
  }

  if (!slots().label && !local['aria-labelledby']) {
    console.warn(
      'A choice group must be labelled using a `CheckboxGroup.Label` or `RadioGroup.Label` child, or by passing `aria-labelledby` to the group component.',
    )
  }

  return (
    <div>
      <Show
        when={slots().label}
        fallback={
          <div
            {...(rest as JSX.HTMLAttributes<HTMLDivElement>)}
            ref={(element) => assignRef(local.rootRef, element)}
            class={mergeClassNames(
              styles.GroupFieldset,
              local.className,
              local.class,
            )}
            role="group"
            aria-labelledby={local['aria-labelledby']}
            aria-describedby={descriptionIds()}
            data-choice-input-group=""
            data-validation={slots().validation ? true : undefined}
          >
            <Show when={slots().caption}>
              {renderCaption(slots().caption!, captionId())}
            </Show>
            <Show when={local.required}>
              <VisuallyHidden id={requiredMessageId()}>Required</VisuallyHidden>
            </Show>
            <div class={styles.Body}>{slots().items}</div>
          </div>
        }
      >
        <fieldset
          {...rest}
          ref={(element) => assignRef(local.rootRef, element)}
          class={mergeClassNames(
            styles.GroupFieldset,
            local.className,
            local.class,
          )}
          disabled={local.disabled}
          data-choice-input-group=""
          data-validation={slots().validation ? true : undefined}
        >
          <legend
            class={styles.GroupLegend}
            data-legend-visible={
              !((slots().label!.props as ChoiceInputGroupLabelProps).visuallyHidden)
                ? true
                : undefined
            }
          >
            {renderLabel(slots().label!, local.required, local.disabled)}
            <Show when={local.required}>
              <VisuallyHidden>, required</VisuallyHidden>
            </Show>
            <Show when={slots().caption}>
              {renderCaption(slots().caption!, captionId())}
            </Show>
            <Show when={slots().validation && slots().validation!.props.children}>
              <VisuallyHidden>{slots().validation!.props.children}</VisuallyHidden>
            </Show>
          </legend>
          <div class={styles.Body}>{slots().items}</div>
        </fieldset>
      </Show>
      <Show when={slots().validation}>
        {renderValidation(slots().validation!, validationId(), Boolean(slots().label))}
      </Show>
    </div>
  )
}

ChoiceInputGroupLabelImpl.displayName = 'ChoiceInputGroup.Label'
ChoiceInputGroupCaptionImpl.displayName = 'ChoiceInputGroup.Caption'
ChoiceInputGroupValidationImpl.displayName = 'ChoiceInputGroup.Validation'
ChoiceInputGroupRoot.displayName = 'ChoiceInputGroup'

export const ChoiceInputGroupLabel = ChoiceInputGroupLabelImpl as typeof ChoiceInputGroupLabelImpl & {
  __SLOT__?: symbol
}
export const ChoiceInputGroupCaption = ChoiceInputGroupCaptionImpl as typeof ChoiceInputGroupCaptionImpl & {
  __SLOT__?: symbol
}
export const ChoiceInputGroupValidation =
  ChoiceInputGroupValidationImpl as typeof ChoiceInputGroupValidationImpl & {
    __SLOT__?: symbol
  }

ChoiceInputGroupLabel.__SLOT__ = Symbol('ChoiceInputGroupLabel')
ChoiceInputGroupCaption.__SLOT__ = Symbol('ChoiceInputGroupCaption')
ChoiceInputGroupValidation.__SLOT__ = Symbol('ChoiceInputGroupValidation')
