import {
  RadioGroupCaption,
  RadioGroupImpl,
  RadioGroupLabel,
  RadioGroupValidation,
} from './RadioGroup'
import type {
  RadioGroupCaptionProps,
  RadioGroupLabelProps,
  RadioGroupProps,
  RadioGroupValidationProps,
} from './RadioGroup'

const RadioGroup = Object.assign(RadioGroupImpl, {
  Caption: RadioGroupCaption,
  Label: RadioGroupLabel,
  Validation: RadioGroupValidation,
})

export { RadioGroup }
export type {
  RadioGroupCaptionProps,
  RadioGroupLabelProps,
  RadioGroupProps,
  RadioGroupValidationProps,
}
export default RadioGroup
