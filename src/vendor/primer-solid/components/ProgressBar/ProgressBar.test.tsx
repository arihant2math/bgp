import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './index'
import styles from './ProgressBar.module.css'

describe('ProgressBar', () => {
  it('applies the expected classes', () => {
    const root = render(() => (
      <ProgressBar progress={80} aria-label="Upload test.png" />
    ))
    expect(root.container.firstChild).toHaveClass(styles.ProgressBarContainer)
    root.unmount()

    const item = render(() => (
      <ProgressBar.Item progress={80} aria-label="Upload test.png" />
    ))
    expect(item.getByRole('progressbar')).toHaveClass(styles.ProgressBarItem)
  })

  it('respects the "barSize" prop', () => {
    const barSizeSmall = render(() => (
      <ProgressBar progress={80} barSize="small" aria-label="Upload test.png" />
    ))
    expect(barSizeSmall.container.firstChild).toHaveAttribute(
      'data-progress-bar-size',
      'small',
    )
    barSizeSmall.unmount()

    const barSizeDefault = render(() => (
      <ProgressBar
        progress={80}
        barSize="default"
        aria-label="Upload test.png"
      />
    ))
    expect(barSizeDefault.container.firstChild).toHaveAttribute(
      'data-progress-bar-size',
      'default',
    )
    barSizeDefault.unmount()

    const barSizeLarge = render(() => (
      <ProgressBar progress={80} barSize="large" aria-label="Upload test.png" />
    ))
    expect(barSizeLarge.container.firstChild).toHaveAttribute(
      'data-progress-bar-size',
      'large',
    )
  })

  it('respects the "inline" prop', () => {
    const { container } = render(() => (
      <ProgressBar
        progress={80}
        barSize="small"
        aria-label="Upload test.png"
        inline
      />
    ))

    expect(container.firstChild).toHaveAttribute(
      'data-progress-display',
      'inline',
    )
  })

  it('passes the `aria-label` down to the progress bar', () => {
    render(() => <ProgressBar progress={80} aria-label="Upload test.png" />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Upload test.png',
    )
    expect(screen.getByLabelText('Upload test.png')).toBeInTheDocument()
  })

  it('passes the `aria-valuenow` down to the progress bar', () => {
    render(() => <ProgressBar progress={80} aria-valuenow={80} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '80',
    )
  })

  it('passes the `aria-valuetext` down to the progress bar', () => {
    render(() => <ProgressBar aria-valuetext="80 percent" />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '80 percent',
    )
  })

  it('does not pass the `aria-label` down to the progress bar if there are multiple items', () => {
    render(() => (
      <ProgressBar aria-label="Upload test.png">
        <ProgressBar.Item progress={80} />
      </ProgressBar>
    ))

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-label')
  })

  it('passes aria attributes to the progress bar item', () => {
    render(() => (
      <ProgressBar>
        <ProgressBar.Item
          progress={50}
          aria-label="Progress"
          aria-valuenow="50"
        />
      </ProgressBar>
    ))

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Progress',
    )
  })

  it('provides `aria-valuenow` to the progress bar item if it is not already provided', () => {
    render(() => <ProgressBar progress={50} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
  })

  it('applies `0` as a value for `aria-valuenow`', () => {
    render(() => (
      <ProgressBar
        progress={0}
        aria-valuenow={0}
        aria-label="Upload test.png"
      />
    ))

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
  })

  it('accepts class and className on the root element', () => {
    const { container } = render(() => (
      <ProgressBar
        progress={80}
        aria-label="Upload test.png"
        class="solid-class"
        className="react-class"
        data-testid="progress-root"
      />
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
    expect(container.firstChild).toHaveAttribute('data-testid', 'progress-root')
  })

  it('accepts class and className on items', () => {
    render(() => (
      <ProgressBar.Item
        progress={80}
        aria-label="Upload test.png"
        class="solid-class"
        className="react-class"
        data-testid="progress-item"
      />
    ))

    const item = screen.getByRole('progressbar')
    expect(item).toHaveClass('solid-class')
    expect(item).toHaveClass('react-class')
    expect(item).toHaveAttribute('data-testid', 'progress-item')
  })

  it('throws when both children and progress are provided', () => {
    expect(() =>
      render(() => (
        <ProgressBar progress={80}>
          <ProgressBar.Item progress={20} aria-label="Chunk" />
        </ProgressBar>
      )),
    ).toThrow('You should pass `progress` or children, not both.')
  })

  describe('bg prop', () => {
    it('applies default success bg color when no bg prop is provided', () => {
      render(() => <ProgressBar progress={50} aria-label="Upload test.png" />)
      const progressBar = screen.getByRole('progressbar') as HTMLElement

      expect(progressBar.style.getPropertyValue('--progress-bg')).toBe(
        'var(--bgColor-success-emphasis)',
      )
    })

    it('applies custom bg color when bg prop is provided', () => {
      render(() => (
        <ProgressBar
          progress={50}
          bg="danger.emphasis"
          aria-label="Upload test.png"
        />
      ))
      const progressBar = screen.getByRole('progressbar') as HTMLElement

      expect(progressBar.style.getPropertyValue('--progress-bg')).toBe(
        'var(--bgColor-danger-emphasis)',
      )
    })

    it('handles different color variants correctly', () => {
      const colorVariants = [
        {
          input: 'danger.emphasis',
          expected: 'var(--bgColor-danger-emphasis)',
        },
        {
          input: 'severe.emphasis',
          expected: 'var(--bgColor-severe-emphasis)',
        },
        {
          input: 'sponsor.emphasis',
          expected: 'var(--bgColor-sponsor-emphasis)',
        },
        { input: 'done.emphasis', expected: 'var(--bgColor-done-emphasis)' },
        {
          input: 'accent.emphasis',
          expected: 'var(--bgColor-accent-emphasis)',
        },
        {
          input: 'success.emphasis',
          expected: 'var(--bgColor-success-emphasis)',
        },
        {
          input: 'neutral.emphasis',
          expected: 'var(--bgColor-neutral-emphasis)',
        },
        {
          input: 'attention.emphasis',
          expected: 'var(--bgColor-attention-emphasis)',
        },
      ]

      for (const { input, expected } of colorVariants) {
        const { unmount } = render(() => (
          <ProgressBar progress={50} bg={input} aria-label="Upload test.png" />
        ))
        const progressBar = screen.getByRole('progressbar') as HTMLElement

        expect(progressBar.style.getPropertyValue('--progress-bg')).toBe(
          expected,
        )
        unmount()
      }
    })

    it('applies bg color to ProgressBar.Item when used in multi-item setup', () => {
      const { container } = render(() => (
        <ProgressBar aria-label="Upload test.png">
          <ProgressBar.Item
            progress={30}
            bg="danger.emphasis"
            aria-label="Danger item"
          />
          <ProgressBar.Item
            progress={20}
            bg="success.emphasis"
            aria-label="Success item"
          />
        </ProgressBar>
      ))

      const progressBars = container.querySelectorAll('[role="progressbar"]')

      expect(
        (progressBars[0] as HTMLElement).style.getPropertyValue(
          '--progress-bg',
        ),
      ).toBe('var(--bgColor-danger-emphasis)')
      expect(
        (progressBars[1] as HTMLElement).style.getPropertyValue(
          '--progress-bg',
        ),
      ).toBe('var(--bgColor-success-emphasis)')
    })

    it('handles bg values without emphasis gracefully', () => {
      render(() => (
        <ProgressBar progress={50} bg="danger" aria-label="Upload test.png" />
      ))
      const progressBar = screen.getByRole('progressbar') as HTMLElement

      expect(progressBar.style.getPropertyValue('--progress-bg')).toBe(
        'var(--bgColor-danger-emphasis)',
      )
    })

    it('preserves progress width regardless of bg color', () => {
      render(() => (
        <ProgressBar
          progress={75}
          bg="danger.emphasis"
          aria-label="Upload test.png"
        />
      ))
      const progressBar = screen.getByRole('progressbar') as HTMLElement

      expect(progressBar.style.getPropertyValue('--progress-width')).toBe('75%')
      expect(progressBar.style.getPropertyValue('--progress-bg')).toBe(
        'var(--bgColor-danger-emphasis)',
      )
    })
  })
})
