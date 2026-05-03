import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import type { DetailsProps } from '../components/Details'

type RefObject<T> = { current?: T | null }
type RefCallback<T> = (element: T) => void
type RefAccessor<T> = Accessor<T | null | undefined>

type DetailsRef =
  | HTMLDetailsElement
  | RefObject<HTMLDetailsElement>
  | RefCallback<HTMLDetailsElement>
  | RefAccessor<HTMLDetailsElement>
  | null
  | undefined

export type UseDetailsParameters = {
  ref?: DetailsRef
  closeOnOutsideClick?: boolean
  defaultOpen?: boolean
  onClickOutside?: (event: MouseEvent) => void
}

export type UseDetailsReturn = {
  open: Accessor<boolean | undefined>
  setOpen: Setter<boolean | undefined>
  getDetailsProps: () => DetailsProps
}

function isRefObject(ref: DetailsRef): ref is RefObject<HTMLDetailsElement> {
  return typeof ref === 'object' && ref !== null && 'current' in ref
}

function isElement(ref: DetailsRef): ref is HTMLDetailsElement {
  return (
    typeof Node !== 'undefined' &&
    typeof ref === 'object' &&
    ref !== null &&
    'nodeType' in ref &&
    ref.nodeType === Node.ELEMENT_NODE
  )
}

function readRef(ref: DetailsRef, fallback: HTMLDetailsElement | undefined) {
  if (typeof ref === 'function') {
    return ref.length === 0
      ? ((ref as RefAccessor<HTMLDetailsElement>)() ?? fallback)
      : fallback
  }

  if (isRefObject(ref)) return ref.current ?? undefined
  if (isElement(ref)) return ref

  return fallback
}

function assignRef(ref: DetailsRef, element: HTMLDetailsElement) {
  if (typeof ref === 'function') {
    if (ref.length > 0) {
      ;(ref as RefCallback<HTMLDetailsElement>)(element)
    }
    return
  }

  if (isRefObject(ref)) {
    ref.current = element
  }
}

export function useDetails({
  ref,
  closeOnOutsideClick,
  defaultOpen,
  onClickOutside,
}: UseDetailsParameters = {}): UseDetailsReturn {
  const [open, setOpen] = createSignal<boolean | undefined>(defaultOpen)
  let backupRef: HTMLDetailsElement | undefined

  const currentDetails = () => readRef(ref, backupRef)

  const onClickOutsideInternal = (event: MouseEvent) => {
    const current = currentDetails()
    const eventTarget = event.target as HTMLElement | null
    const closest = eventTarget?.closest('details')

    if (closest !== current) {
      onClickOutside?.(event)
      if (!event.defaultPrevented) {
        setOpen(false)
      }
    }
  }

  createEffect(() => {
    if (open() && closeOnOutsideClick) {
      document.addEventListener('click', onClickOutsideInternal)
      onCleanup(() => {
        document.removeEventListener('click', onClickOutsideInternal)
      })
    }
  })

  const handleToggle = (event: Event) => {
    if (!event.defaultPrevented) {
      const eventTarget = event.target as HTMLDetailsElement
      setOpen(eventTarget.open)
    }
  }

  const getDetailsProps = () => {
    const detailsProps: DetailsProps = {
      onToggle: handleToggle,
      ref: (element) => {
        backupRef = element
        assignRef(ref, element)
      },
    }

    Object.defineProperty(detailsProps, 'open', {
      enumerable: true,
      get: open,
    })

    return detailsProps
  }

  return { open, setOpen, getDetailsProps }
}

export default useDetails
