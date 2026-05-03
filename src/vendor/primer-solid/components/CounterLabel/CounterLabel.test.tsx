import { render } from '@solidjs/testing-library'
import { CounterLabel } from './CounterLabel'
import styles from './CounterLabel.module.css'

describe('CounterLabel', () => {
  it('renders a <span>', () => {
    const { container } = render(() => <CounterLabel>1234</CounterLabel>)

    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('renders the counter correctly', () => {
    const { container } = render(() => <CounterLabel>12K</CounterLabel>)

    expect(container.firstChild).toHaveTextContent('12K')
  })

  it('applies the CounterLabel class', () => {
    const { container } = render(() => <CounterLabel>1234</CounterLabel>)

    expect(container.firstChild).toHaveClass(styles.CounterLabel)
  })

  it('renders the visible span with aria-hidden=true', () => {
    const { container } = render(() => <CounterLabel>1234</CounterLabel>)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('respects the primary variant prop', () => {
    const { container } = render(() => (
      <CounterLabel variant="primary">1234</CounterLabel>
    ))

    expect(container.firstChild).toHaveAttribute('data-variant', 'primary')
  })

  it('respects the secondary variant prop', () => {
    const { container } = render(() => (
      <CounterLabel variant="secondary">1234</CounterLabel>
    ))

    expect(container.firstChild).toHaveAttribute('data-variant', 'secondary')
  })

  it('respects the primary scheme prop', () => {
    const { container } = render(() => <CounterLabel scheme="primary">1234</CounterLabel>)

    expect(container.firstChild).toHaveAttribute('data-variant', 'primary')
  })

  it('renders with secondary variant by default', () => {
    const { container } = render(() => <CounterLabel>1234</CounterLabel>)

    expect(container.firstChild).toHaveAttribute('data-variant', 'secondary')
  })

  it('prefers variant over scheme', () => {
    const { container } = render(() => (
      <CounterLabel scheme="secondary" variant="primary">
        1234
      </CounterLabel>
    ))

    expect(container.firstChild).toHaveAttribute('data-variant', 'primary')
  })

  it('renders the visually hidden screen reader label', () => {
    const { container } = render(() => <CounterLabel>1234</CounterLabel>)

    expect(container.children[1]?.textContent).toBe('\u00a0(1234)')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <CounterLabel class="solid-class" className="react-class">
        1234
      </CounterLabel>
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('passes through native span props', () => {
    const { container } = render(() => (
      <CounterLabel data-testid="counter" title="Count" style={{ color: 'red' }}>
        1234
      </CounterLabel>
    ))

    expect(container.firstChild).toHaveAttribute('data-testid', 'counter')
    expect(container.firstChild).toHaveAttribute('title', 'Count')
    expect(container.firstChild).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })
})
