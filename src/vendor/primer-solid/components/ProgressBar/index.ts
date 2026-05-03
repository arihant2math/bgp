import { Item, ProgressBarImpl } from './ProgressBar'
import type { ProgressBarItemProps, ProgressBarProps } from './ProgressBar'

const ProgressBar = Object.assign(ProgressBarImpl, { Item })

export { ProgressBar }
export type { ProgressBarItemProps, ProgressBarProps }
export default ProgressBar
