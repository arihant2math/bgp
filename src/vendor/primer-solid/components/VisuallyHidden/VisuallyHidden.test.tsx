import { render, screen } from '@solidjs/testing-library'
import { VisuallyHidden } from './VisuallyHidden'
import styles from './VisuallyHidden.module.css'

describe('VisuallyHidden', () => {
  it('renders a <span> by default', () => {
    const { container } = render(() => <VisuallyHidden />)

    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('renders children', () => {
    render(() => <VisuallyHidden>Hello World</VisuallyHidden>)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <VisuallyHidden class="solid-class" className="react-class">
        Hello
      </VisuallyHidden>
    ))

    expect(container.firstChild).toHaveClass(styles.VisuallyHidden)
    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('passes through native span props', () => {
    const { container } = render(() => (
      <VisuallyHidden data-testid="hidden-text" aria-live="polite" style={{ color: 'red' }}>
        Hello
      </VisuallyHidden>
    ))

    expect(container.firstChild).toHaveAttribute('data-testid', 'hidden-text')
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
    expect(container.firstChild).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('always renders a span and ignores legacy as and sx props', () => {
    const legacyProps = {
      as: 'div',
      sx: { color: 'blue' },
      'data-testid': 'hidden-text',
    } as any

    render(() => <VisuallyHidden {...legacyProps}>Hello</VisuallyHidden>)

    const element = screen.getByTestId('hidden-text')

    expect(element.nodeName).toBe('SPAN')
    expect(element).not.toHaveAttribute('as')
    expect(element).not.toHaveAttribute('sx')
    expect(element).not.toHaveStyle({ color: 'blue' })
  })
})
