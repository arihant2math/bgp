import type { ValidComponent } from 'solid-js'
import { ButtonBase } from './ButtonBase'
import type { ButtonProps } from './types'

export function Button<As extends ValidComponent = 'button'>(
  props: ButtonProps<As>,
) {
  return <ButtonBase as="button" type="button" {...props} />
}

Button.displayName = 'Button'
;(Button as typeof Button & { __SLOT__?: symbol }).__SLOT__ =
  Symbol('Button')

export default Button
