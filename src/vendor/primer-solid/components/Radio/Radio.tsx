import { createEffect, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames } from '../../utils'
import { assignRef, callEventHandler, type RefProp } from '../../utils/solid'
import { RadioGroupContext } from '../RadioGroup/RadioGroupContext'
import sharedClasses from '../Checkbox/shared.module.css'
import classes from './Radio.module.css'

export type RadioProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'children' | 'className' | 'ref' | 'type' | 'value'
> & {
  value: string
  name?: string
  disabled?: boolean
  checked?: boolean
  defaultChecked?: boolean
  ref?: RefProp<HTMLInputElement>
  required?: boolean
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export function Radio(props: RadioProps) {
  let inputRef: HTMLInputElement | undefined

  const groupContext = RadioGroupContext?.() ?? null
  const [local, rest] = splitProps(props, [
    'aria-hidden',
    'checked',
    'class',
    'className',
    'defaultChecked',
    'disabled',
    'name',
    'onChange',
    'ref',
    'required',
    'value',
  ])

  const syncAriaChecked = (element: HTMLInputElement) => {
    element.setAttribute('aria-checked', element.checked ? 'true' : 'false')
  }

  const handleChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (
    event,
  ) => {
    groupContext?.onChange?.(
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
    syncAriaChecked(event.currentTarget)
  }

  const name = () => local.name ?? groupContext?.name

  if (!name() && !local['aria-hidden']) {
    console.warn(
      'A radio input must have a `name` attribute. Pass `name` directly to Radio, or nest radios in a `RadioGroup` with a `name` prop.',
    )
  }

  createEffect(() => {
    if (!inputRef) return
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
      type="radio"
      value={local.value}
      name={name()}
      disabled={local.disabled || groupContext?.disabled}
      checked={local.checked}
      required={local.required}
      aria-checked={local.checked ? 'true' : 'false'}
      aria-hidden={local['aria-hidden']}
      onChange={handleChange}
      class={mergeClassNames(
        sharedClasses.Input,
        classes.Radio,
        local.className,
        local.class,
      )}
    />
  )
}

Radio.displayName = 'Radio'
;(Radio as typeof Radio & { __SLOT__?: symbol }).__SLOT__ = Symbol('Radio')

export default Radio
