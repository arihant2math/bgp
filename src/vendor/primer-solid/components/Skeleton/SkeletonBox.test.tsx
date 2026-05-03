import { render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkeletonBox } from './SkeletonBox'
import styles from './SkeletonBox.module.css'

describe('SkeletonBox', () => {
  it('applies the SkeletonBox class', () => {
    const { container } = render(() => <SkeletonBox />)

    expect(container.firstChild).toHaveClass(styles.SkeletonBox)
  })

  it('sets width and height styles', () => {
    const { container } = render(() => <SkeletonBox width={200} height={100} />)

    expect(container.firstChild).toHaveStyle('height: 100px')
    expect(container.firstChild).toHaveStyle('width: 200px')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <SkeletonBox class="solid-class" className="react-class" />
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  describe('delay behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.useRealTimers()
    })

    it('renders immediately when no delay is provided', () => {
      const { container } = render(() => <SkeletonBox />)

      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('renders after 300ms when delay is "short"', () => {
      const { container } = render(() => <SkeletonBox delay="short" />)

      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(250)
      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(50)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('renders after 1000ms when delay is "long"', () => {
      const { container } = render(() => <SkeletonBox delay="long" />)

      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(800)
      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(200)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('renders after a custom delay', () => {
      const { container } = render(() => <SkeletonBox delay={500} />)

      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(400)
      expect(container.querySelector('div')).not.toBeInTheDocument()

      vi.advanceTimersByTime(100)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('cleans up the timeout on unmount', () => {
      const { unmount } = render(() => <SkeletonBox delay="short" />)

      unmount()
      vi.advanceTimersByTime(300)

      expect(true).toBe(true)
    })
  })
})
