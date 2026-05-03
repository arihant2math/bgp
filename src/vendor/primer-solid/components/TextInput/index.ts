import { TextInputAction, TextInputImpl } from './TextInput'
import type {
  TextInputActionProps,
  TextInputNonPassthroughProps,
  TextInputProps,
} from './TextInput'

const TextInput = Object.assign(TextInputImpl, {
  __SLOT__: Symbol('TextInput'),
  Action: TextInputAction,
})

export { TextInput, TextInputAction }
export type {
  TextInputActionProps,
  TextInputNonPassthroughProps,
  TextInputProps,
}
export default TextInput
