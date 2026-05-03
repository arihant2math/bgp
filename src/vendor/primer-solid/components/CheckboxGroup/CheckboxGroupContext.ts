import { createContext, useContext } from 'solid-js'

type CheckboxGroupContextValue = {
  disabled?: boolean
  onChange?: (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => void
}

const Context = createContext<CheckboxGroupContextValue>({})

export function CheckboxGroupContext() {
  return useContext(Context)
}

export const CheckboxGroupProvider = Context.Provider
