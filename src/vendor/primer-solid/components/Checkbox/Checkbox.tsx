import { createEffect, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames } from '../../utils'
import { assignRef, callEventHandler, type RefProp } from '../../utils/solid'
import { CheckboxGroupContext } from '../CheckboxGroup/CheckboxGroupContext'
import classes from './Checkbox.module.css'
import sharedClasses from './shared.module.css'

export type FormValidationStatus = 'error' | 'success'

export type CheckboxProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'children' | 'className' | 'ref' | 'type' | 'value'
> & {
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  ref?: RefProp<HTMLInputElement>
  required?: boolean
  validationStatus?: FormValidationStatus
  value?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export function Checkbox(props: CheckboxProps) {
  let inputRef: HTMLInputElement | undefined

  const groupContext = CheckboxGroupContext?.() ?? {}
  const [local, rest] = splitProps(props, [
    'checked',
    'class',
    'className',
    'defaultChecked',
    'disabled',
    'indeterminate',
    'name',
    'onChange',
    'ref',
    'required',
    'validationStatus',
    'value',
  ])

  const syncAriaChecked = (element: HTMLInputElement) => {
    element.setAttribute(
      'aria-checked',
      local.indeterminate ? 'mixed' : element.checked ? 'true' : 'false',
    )
  }

  const handleChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (
    event,
  ) => {
    groupContext.onChange?.(
      event as Event & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )
    callEventHandler(
      local.onChange,
      event as Event & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    )

    if (local.indeterminate) {
      event.currentTarget.indeterminate = true
    }

    syncAriaChecked(event.currentTarget)
  }

  createEffect(() => {
    if (!inputRef) return

    inputRef.indeterminate = local.indeterminate ?? false
    syncAriaChecked(inputRef)
  })

  return (
    <input
      {...rest}
      ref={(element) => {
        inputRef = element

        if (local.checked === undefined && local.defaultChecked !== undefined) {
          element.checked = local.defaultChecked
        }

        assignRef(local.ref, element)
      }}
      type="checkbox"
      class={mergeClassNames(
        sharedClasses.Input,
        classes.Checkbox,
        local.className,
        local.class,
      )}
      disabled={local.disabled || groupContext.disabled}
      checked={local.indeterminate ? false : local.checked}
      required={local.required}
      aria-required={local.required ? 'true' : 'false'}
      aria-invalid={local.validationStatus === 'error' ? 'true' : 'false'}
      onChange={handleChange}
      value={local.value}
      name={local.name ?? local.value}
    />
  )
}

Checkbox.displayName = 'Checkbox'
;(Checkbox as typeof Checkbox & { __SLOT__?: symbol }).__SLOT__ =
  Symbol('Checkbox')

export default Checkbox
