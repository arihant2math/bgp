import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

type ElementRef<T extends Element> =
  | T
  | undefined
  | null
  | { current?: T | null }
  | Accessor<T | undefined | null>

type UseOnOutsideClickParameters = {
  containerRef: ElementRef<Element>
  ignoreClickRefs?: Array<ElementRef<Element>>
  onClickOutside: (event: MouseEvent) => void
}

function resolveElement<T extends Element>(ref: ElementRef<T>): T | undefined {
  if (typeof ref === 'function') return (ref() as T | null | undefined) ?? undefined
  if (typeof ref === 'object' && ref !== null && 'current' in ref) {
    return (ref.current as T | null | undefined) ?? undefined
  }
  return (ref as T | null | undefined) ?? undefined
}

export function useOnOutsideClick({
  containerRef,
  ignoreClickRefs = [],
  onClickOutside,
}: UseOnOutsideClickParameters) {
  createEffect(() => {
    if (typeof document === 'undefined') return

    const handleClick = (event: MouseEvent) => {
      const container = resolveElement(containerRef)
      const target = event.target

      if (!(target instanceof Node) || !container) return
      if (container.contains(target)) return

      for (const ignoredRef of ignoreClickRefs) {
        const ignoredElement = resolveElement(ignoredRef)
        if (ignoredElement?.contains(target)) {
          return
        }
      }

      onClickOutside(event)
    }

    document.addEventListener('click', handleClick)
    onCleanup(() => {
      document.removeEventListener('click', handleClick)
    })
  })
}

export default useOnOutsideClick
