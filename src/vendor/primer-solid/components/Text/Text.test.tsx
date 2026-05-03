import { render, screen } from '@solidjs/testing-library'
import { Text } from './Text'

describe('Text', () => {
  it('renders a <span> by default', () => {
    const { container } = render(() => <Text />)

    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('renders children', () => {
    render(() => <Text>Hello World</Text>)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Text class="solid-class" className="react-class">
        Hello
      </Text>
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('renders as a different element when as prop is provided', () => {
    const { container } = render(() => <Text as="p">Hello</Text>)

    expect(container.firstChild?.nodeName).toBe('P')
  })

  it('passes through other props', () => {
    const { container } = render(() => (
      <Text data-testid="text-element">Hello</Text>
    ))

    expect(container.firstChild).toHaveAttribute('data-testid', 'text-element')
  })

  it('sets size and weight data attributes only when provided', () => {
    const { container } = render(() => (
      <Text size="large" weight="semibold">
        Hello
      </Text>
    ))

    expect(container.firstChild).toHaveAttribute('data-size', 'large')
    expect(container.firstChild).toHaveAttribute('data-weight', 'semibold')
  })

  it('does not set default size or weight data attributes', () => {
    const { container } = render(() => <Text>Hello</Text>)

    expect(container.firstChild).not.toHaveAttribute('data-size')
    expect(container.firstChild).not.toHaveAttribute('data-weight')
  })
})
