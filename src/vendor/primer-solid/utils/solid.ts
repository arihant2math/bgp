export type RefProp<T> = ((element: T) => void) | { current?: T | null } | undefined

export function assignRef<T>(ref: RefProp<T>, element: T) {
  if (typeof ref === 'function') {
    ref(element)
    return
  }

  if (ref) {
    ref.current = element
  }
}

export function callEventHandler<T extends Element, E extends Event>(
  handler: unknown,
  event: E & { currentTarget: T; target: T },
) {
  if (!handler) return

  if (typeof handler === 'function') {
    ;(handler as (event: E & { currentTarget: T; target: T }) => void)(event)
    return
  }

  const [fn, data] = handler as [
    (data: unknown, event: E & { currentTarget: T; target: T }) => void,
    unknown,
  ]

  fn(data, event)
}
