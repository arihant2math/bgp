import { createEffect, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { mergeClassNames, mergeStyles } from '../../utils'
import { assignRef, type RefProp } from '../../utils/solid'
import textInputStyles from '../TextInput/TextInput.module.css'
import styles from './Select.module.css'

export type FormValidationStatus = 'error' | 'success'
export type SelectSize = 'small' | 'medium' | 'large'

function toCssSize(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

export type SelectProps = Omit<
  JSX.SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'className' | 'multiple' | 'ref' | 'size'
> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  defaultValue?: string
  placeholder?: string
  block?: boolean
  disabled?: boolean
  validationStatus?: FormValidationStatus
  size?: SelectSize
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  ref?: RefProp<HTMLSelectElement>
}

export type SelectOptionProps = JSX.OptionHTMLAttributes<HTMLOptionElement> & {
  value: string
}

export type SelectOptGroupProps =
  JSX.OptgroupHTMLAttributes<HTMLOptGroupElement>

function ArrowIndicator(props: { class?: string }) {
  return (
    <svg
      aria-hidden="true"
      class={props.class}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m4.074 9.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.043 9H4.251a.25.25 0 0 0-.177.427ZM4.074 7.47 7.47 4.073a.25.25 0 0 1 .354 0L11.22 7.47a.25.25 0 0 1-.177.426H4.251a.25.25 0 0 1-.177-.426Z" />
    </svg>
  )
}

export function SelectImpl(props: SelectProps) {
  let selectRef: HTMLSelectElement | undefined

  const [local, rest] = splitProps(props, [
    'block',
    'children',
    'class',
    'className',
    'defaultValue',
    'disabled',
    'maxWidth',
    'minWidth',
    'placeholder',
    'ref',
    'required',
    'size',
    'validationStatus',
    'value',
    'width',
  ])

  createEffect(() => {
    if (!selectRef) return

    if (local.value !== undefined) {
      selectRef.value = String(local.value)
      return
    }

    if (local.defaultValue !== undefined) {
      selectRef.value = String(local.defaultValue)
      return
    }

    if (local.placeholder) {
      selectRef.value = ''
    }
  })

  return (
    <span
      class={mergeClassNames(
        textInputStyles.TextInputBaseWrapper,
        textInputStyles.TextInputWrapper,
        styles.TextInputWrapper,
        local.className,
        local.class,
      )}
      data-block={local.block ? true : undefined}
      data-disabled={local.disabled ? true : undefined}
      data-size={local.size}
      data-trailing-visual={true}
      data-validation={local.validationStatus}
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
      <select
        {...rest}
        ref={(element) => {
          selectRef = element
          assignRef(local.ref, element)
        }}
        required={local.required}
        disabled={local.disabled}
        aria-invalid={local.validationStatus === 'error' ? 'true' : 'false'}
        class={styles.Select}
        data-hasplaceholder={local.placeholder ? true : undefined}
      >
        {local.placeholder ? (
          <option value="" disabled={local.required} hidden={local.required}>
            {local.placeholder}
          </option>
        ) : null}
        {local.children}
      </select>
      <ArrowIndicator class={styles.ArrowIndicator} />
    </span>
  )
}

export function SelectOption(props: SelectOptionProps) {
  return <option {...props} />
}

export function SelectOptGroup(props: SelectOptGroupProps) {
  return <optgroup {...props} />
}

SelectImpl.displayName = 'Select'
SelectOption.displayName = 'Select.Option'
SelectOptGroup.displayName = 'Select.OptGroup'
