import { createEffect, onCleanup } from 'solid-js'

export function useOnEscapePress(onEscapePress: (event: KeyboardEvent) => void) {
  createEffect(() => {
    if (typeof document === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapePress(event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })
  })
}

export default useOnEscapePress
