import { createEffect, splitProps } from 'solid-js'
import {
  ChoiceInputGroupCaption,
  ChoiceInputGroupLabel,
  ChoiceInputGroupRoot,
  ChoiceInputGroupValidation,
  type ChoiceInputGroupCaptionProps,
  type ChoiceInputGroupLabelProps,
  type ChoiceInputGroupProps,
  type ChoiceInputGroupValidationProps,
} from '../_ChoiceInputGroup/ChoiceInputGroup'
import {
  CheckboxGroupContext,
  CheckboxGroupProvider,
} from './CheckboxGroupContext'

export type CheckboxGroupProps = ChoiceInputGroupProps & {
  onChange?: (
    selected: string[],
    event?: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => void
}

export function CheckboxGroupImpl(props: CheckboxGroupProps) {
  let rootRef: HTMLFieldSetElement | HTMLDivElement | undefined
  let selectedValues: string[] = []

  const [local, rest] = splitProps(props, ['children', 'disabled', 'onChange'])

  createEffect(() => {
    if (!rootRef) return
    selectedValues = Array.from(
      rootRef.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
    ).map((checkbox) => checkbox.value)
  })

  const handleChange = (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => {
    const { checked, value } = event.currentTarget

    if (checked) {
      selectedValues = selectedValues.includes(value)
        ? selectedValues
        : [...selectedValues, value]
    } else {
      selectedValues = selectedValues.filter(
        (selectedValue) => selectedValue !== value,
      )
    }

    local.onChange?.(selectedValues, event as Event & {
      currentTarget: HTMLInputElement
      target: HTMLInputElement
    })
  }

  return (
    <CheckboxGroupProvider
      value={{
        disabled: local.disabled,
        onChange: handleChange,
      }}
    >
      <ChoiceInputGroupRoot disabled={local.disabled} rootRef={(element) => (rootRef = element)} {...rest}>
        {local.children}
      </ChoiceInputGroupRoot>
    </CheckboxGroupProvider>
  )
}

CheckboxGroupImpl.displayName = 'CheckboxGroup'
;(CheckboxGroupImpl as typeof CheckboxGroupImpl & { __SLOT__?: symbol }).__SLOT__ =
  Symbol('CheckboxGroup')

export const CheckboxGroupLabel = ChoiceInputGroupLabel
export const CheckboxGroupCaption = ChoiceInputGroupCaption
export const CheckboxGroupValidation = ChoiceInputGroupValidation

export type {
  ChoiceInputGroupCaptionProps as CheckboxGroupCaptionProps,
  ChoiceInputGroupLabelProps as CheckboxGroupLabelProps,
  ChoiceInputGroupValidationProps as CheckboxGroupValidationProps,
}

export { CheckboxGroupContext }
