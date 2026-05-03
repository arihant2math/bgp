import { SelectImpl, SelectOptGroup, SelectOption } from './Select'
import type {
  SelectOptGroupProps,
  SelectOptionProps,
  SelectProps,
  SelectSize,
} from './Select'

const Select = Object.assign(SelectImpl, {
  __SLOT__: Symbol('Select'),
  Option: SelectOption,
  OptGroup: SelectOptGroup,
})

export { Select, SelectOptGroup, SelectOption }
export type {
  SelectOptGroupProps,
  SelectOptionProps,
  SelectProps,
  SelectSize,
}
export default Select
