import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

type MediaQueryListWithLegacyListeners = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

/**
 * Reactive media query hook.
 *
 * Returns an accessor that tracks whether the provided media query currently
 * matches. When `defaultState` is provided, it will be used as the initial
 * value to avoid SSR hydration mismatches.
 */
export function useMedia(
  mediaQueryString: string,
  defaultState?: boolean,
): Accessor<boolean> {
  const getInitialValue = () => {
    if (defaultState !== undefined) return defaultState
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia(mediaQueryString).matches
    }
    return false
  }

  const [matches, setMatches] = createSignal(getInitialValue())

  createEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQueryList = window.matchMedia(
      mediaQueryString,
    ) as MediaQueryListWithLegacyListeners
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    setMatches(mediaQueryList.matches)

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', listener)
      onCleanup(() => mediaQueryList.removeEventListener('change', listener))
      return
    }

    mediaQueryList.addListener?.(listener)
    onCleanup(() => mediaQueryList.removeListener?.(listener))
  })

  return matches
}

export default useMedia
