import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

type ElementRef<T extends Element> =
  | T
  | undefined
  | null
  | { current?: T | null }
  | Accessor<T | undefined | null>

export type ResizeObserverEntry = globalThis.ResizeObserverEntry

function resolveElement<T extends Element>(ref: ElementRef<T>): T | undefined {
  if (typeof ref === 'function') return (ref() as T | null | undefined) ?? undefined
  if (typeof ref === 'object' && ref !== null && 'current' in ref) {
    return (ref.current as T | null | undefined) ?? undefined
  }
  return (ref as T | null | undefined) ?? undefined
}

export function useResizeObserver(
  onResize: (entries: ResizeObserverEntry[]) => void,
  ref: ElementRef<Element>,
) {
  createEffect(() => {
    const element = resolveElement(ref)

    if (
      !element ||
      typeof ResizeObserver === 'undefined' ||
      typeof ResizeObserver !== 'function'
    ) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      onResize(entries as ResizeObserverEntry[])
    })

    observer.observe(element)
    onCleanup(() => {
      observer.disconnect()
    })
  })
}

export default useResizeObserver
