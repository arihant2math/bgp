import {
  CheckboxGroupCaption,
  CheckboxGroupImpl,
  CheckboxGroupLabel,
  CheckboxGroupValidation,
} from './CheckboxGroup'
import type {
  CheckboxGroupCaptionProps,
  CheckboxGroupLabelProps,
  CheckboxGroupProps,
  CheckboxGroupValidationProps,
} from './CheckboxGroup'

const CheckboxGroup = Object.assign(CheckboxGroupImpl, {
  Caption: CheckboxGroupCaption,
  Label: CheckboxGroupLabel,
  Validation: CheckboxGroupValidation,
})

export { CheckboxGroup }
export type {
  CheckboxGroupCaptionProps,
  CheckboxGroupLabelProps,
  CheckboxGroupProps,
  CheckboxGroupValidationProps,
}
export default CheckboxGroup
