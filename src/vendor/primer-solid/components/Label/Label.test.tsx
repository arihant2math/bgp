import { render, screen } from '@solidjs/testing-library'
import { Label } from './Label'
import styles from './Label.module.css'

describe('Label', () => {
  it('renders a <span> by default', () => {
    const { container } = render(() => <Label>Default</Label>)

    expect(container.firstChild?.nodeName).toBe('SPAN')
    expect(container.firstChild).toHaveClass(styles.Label)
  })

  it('renders text node children', () => {
    render(() => <Label>Default</Label>)

    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('renders with the default size and variant', () => {
    const { container } = render(() => <Label>Default</Label>)

    expect(container.firstChild).toHaveAttribute('data-size', 'small')
    expect(container.firstChild).toHaveAttribute('data-variant', 'default')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Label class="solid-class" className="react-class">
        Default
      </Label>
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('renders as a different element when as prop is provided', () => {
    const { container } = render(() => <Label as="div">Default</Label>)

    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('passes through native props', () => {
    const { container } = render(() => (
      <Label data-testid="label" title="Status">
        Default
      </Label>
    ))

    expect(container.firstChild).toHaveAttribute('data-testid', 'label')
    expect(container.firstChild).toHaveAttribute('title', 'Status')
  })
})
