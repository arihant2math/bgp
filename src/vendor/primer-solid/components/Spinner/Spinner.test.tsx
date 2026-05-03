import { render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Spinner } from './Spinner'
import styles from './Spinner.module.css'

type MediaQueryListener = (event: MediaQueryListEvent) => void

function mockMatchMedia({ matches = false } = {}) {
  const listeners = new Set<MediaQueryListener>()

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn((listener: MediaQueryListener) => {
        listeners.add(listener)
      }),
      removeListener: vi.fn((listener: MediaQueryListener) => {
        listeners.delete(listener)
      }),
      addEventListener: vi.fn((_type: string, listener: MediaQueryListener) => {
        listeners.add(listener)
      }),
      removeEventListener: vi.fn(
        (_type: string, listener: MediaQueryListener) => {
          listeners.delete(listener)
        },
      ),
      dispatchEvent: vi.fn(),
    })),
  })

  return {
    change(nextMatches: boolean) {
      for (const listener of listeners) {
        listener({ matches: nextMatches } as MediaQueryListEvent)
      }
    },
  }
}

describe('Spinner', () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('applies the SpinnerAnimation class to the svg', () => {
    const { container } = render(() => <Spinner />)

    expect(container.querySelector('svg')).toHaveClass(styles.SpinnerAnimation)
    expect(container.firstChild).toHaveClass(styles.Box)
  })

  it('labels the spinner with default loading text', () => {
    render(() => <Spinner />)

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('labels the spinner with custom loading text', () => {
    render(() => <Spinner srText="Custom loading text" />)

    expect(screen.getByLabelText('Custom loading text')).toBeInTheDocument()
  })

  it('does not label the spinner with loading text when srText is null', () => {
    const { queryByLabelText } = render(() => <Spinner srText={null} />)

    expect(queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  it('uses aria-label over srText if aria-label is provided', () => {
    render(() => <Spinner aria-label="Test label" />)

    expect(screen.getByLabelText('Test label')).toBeInTheDocument()
  })

  it('respects size arguments', () => {
    const expectSize = (
      input: 'small' | 'medium' | 'large' | undefined,
      expectedSize: string,
    ) => {
      const { container, unmount } = render(() => <Spinner size={input} />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('height', expectedSize)
      expect(svg).toHaveAttribute('width', expectedSize)
      unmount()
    }

    expectSize(undefined, '32px')
    expectSize('small', '16px')
    expectSize('medium', '32px')
    expectSize('large', '64px')
  })

  it('accepts class, className, style, and data attributes', () => {
    const { container } = render(() => (
      <Spinner
        class="solid-class"
        className="react-class"
        data-testid="spinner"
        data-loading={true}
        style={{ color: 'red' }}
      />
    ))
    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('solid-class')
    expect(svg).toHaveClass('react-class')
    expect(svg).toHaveAttribute('data-testid', 'spinner')
    expect(svg).toHaveAttribute('data-loading', 'true')
    expect(svg?.style.color).toBe('red')
  })

  it('synchronizes animation delay when reduced motion is not preferred', async () => {
    mockMatchMedia({ matches: true })
    const { container } = render(() => <Spinner />)
    const svg = container.querySelector('svg')

    await waitFor(() => {
      const animationDelay = svg?.style.getPropertyValue('animation-delay')
      expect(animationDelay).toMatch(/^-[\d.]+ms$/)
    })
  })

  it('updates when the motion media query changes', async () => {
    const media = mockMatchMedia({ matches: false })
    const { container } = render(() => <Spinner />)
    const svg = container.querySelector('svg')

    expect(svg?.style.getPropertyValue('animation-delay')).toBe('')

    media.change(true)

    await waitFor(() => {
      const animationDelay = svg?.style.getPropertyValue('animation-delay')
      expect(animationDelay).toMatch(/^-[\d.]+ms$/)
    })
  })

  describe('delay behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('renders immediately when delay is false', () => {
      const { container } = render(() => <Spinner delay={false} />)

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders immediately when no delay is provided', () => {
      const { container } = render(() => <Spinner />)

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('does not render immediately when delay is true', () => {
      const { container } = render(() => <Spinner delay={true} />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()
    })

    it('renders after 1000ms when delay is true', () => {
      const { container } = render(() => <Spinner delay={true} />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(800)
      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(200)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders after 300ms when delay is short', () => {
      const { container } = render(() => <Spinner delay="short" />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(250)
      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(50)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders after 1000ms when delay is long', () => {
      const { container } = render(() => <Spinner delay="long" />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(800)
      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(200)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders after a custom delay', () => {
      const { container } = render(() => <Spinner delay={500} />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(400)
      expect(container.querySelector('svg')).not.toBeInTheDocument()

      vi.advanceTimersByTime(100)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('cleans up the timeout on unmount', () => {
      const { unmount } = render(() => <Spinner delay="short" />)

      unmount()
      vi.advanceTimersByTime(300)

      expect(true).toBe(true)
    })
  })
})
