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
import { RadioGroupContext, RadioGroupProvider } from './RadioGroupContext'

export type RadioGroupProps = ChoiceInputGroupProps & {
  onChange?: (
    selected: string | null,
    event?: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => void
  name: string
}

export function RadioGroupImpl(props: RadioGroupProps) {
  let rootRef: HTMLFieldSetElement | HTMLDivElement | undefined
  let selectedValue: string | null = null

  const [local, rest] = splitProps(props, [
    'children',
    'disabled',
    'name',
    'onChange',
  ])

  createEffect(() => {
    if (!rootRef) return
    selectedValue =
      rootRef.querySelector<HTMLInputElement>('input[type="radio"]:checked')
        ?.value ?? null
  })

  const handleChange = (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => {
    if (event.currentTarget.checked) {
      selectedValue = event.currentTarget.value
    }

    local.onChange?.(selectedValue, event as Event & {
      currentTarget: HTMLInputElement
      target: HTMLInputElement
    })
  }

  return (
    <RadioGroupProvider
      value={{
        disabled: local.disabled,
        name: local.name,
        onChange: handleChange,
      }}
    >
      <ChoiceInputGroupRoot disabled={local.disabled} rootRef={(element) => (rootRef = element)} {...rest}>
        {local.children}
      </ChoiceInputGroupRoot>
    </RadioGroupProvider>
  )
}

RadioGroupImpl.displayName = 'RadioGroup'
;(RadioGroupImpl as typeof RadioGroupImpl & { __SLOT__?: symbol }).__SLOT__ =
  Symbol('RadioGroup')

export const RadioGroupLabel = ChoiceInputGroupLabel
export const RadioGroupCaption = ChoiceInputGroupCaption
export const RadioGroupValidation = ChoiceInputGroupValidation

export type {
  ChoiceInputGroupCaptionProps as RadioGroupCaptionProps,
  ChoiceInputGroupLabelProps as RadioGroupLabelProps,
  ChoiceInputGroupValidationProps as RadioGroupValidationProps,
}

export { RadioGroupContext }
