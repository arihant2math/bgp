import { createContext, useContext } from 'solid-js'

type RadioGroupContextValue = {
  disabled?: boolean
  name?: string
  onChange?: (
    event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  ) => void
}

const Context = createContext<RadioGroupContextValue | null>(null)

export function RadioGroupContext() {
  return useContext(Context)
}

export const RadioGroupProvider = Context.Provider
