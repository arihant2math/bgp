import { render, screen } from '@solidjs/testing-library'
import { Card } from './index'
import styles from './Card.module.css'

const TestIcon = () => <svg data-testid="test-icon" aria-hidden="true" />

describe('Card', () => {
  it('renders heading and description slots', () => {
    render(() => (
      <Card>
        <Card.Heading>Test Heading</Card.Heading>
        <Card.Description>Test Description</Card.Description>
      </Card>
    ))

    expect(screen.getByText('Test Heading')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders a heading as an h3 element by default', () => {
    render(() => (
      <Card>
        <Card.Heading>Heading</Card.Heading>
      </Card>
    ))

    expect(
      screen.getByRole('heading', { level: 3, name: 'Heading' }),
    ).toBeInTheDocument()
  })

  it('renders an icon and treats it as decorative without an aria-label', () => {
    render(() => (
      <Card>
        <Card.Icon icon={TestIcon} />
        <Card.Heading>With Icon</Card.Heading>
      </Card>
    ))

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByTestId('test-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('renders an image', () => {
    render(() => (
      <Card>
        <Card.Image src="https://example.com/image.png" alt="Example" />
        <Card.Heading>With Image</Card.Heading>
      </Card>
    ))

    const img = screen.getByRole('img', { name: 'Example' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.png')
  })

  it('renders metadata and menu slots', () => {
    render(() => (
      <Card>
        <Card.Heading>Metadata Card</Card.Heading>
        <Card.Metadata>Updated 2 hours ago</Card.Metadata>
        <Card.Menu>
          <button type="button">Options</button>
        </Card.Menu>
      </Card>
    ))

    expect(screen.getByText('Updated 2 hours ago')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Options' })).toBeInTheDocument()
  })

  it('applies edge-to-edge styling only when image is provided', () => {
    const image = render(() => (
      <Card>
        <Card.Image src="https://example.com/image.png" alt="" />
        <Card.Heading>Edge to Edge</Card.Heading>
      </Card>
    ))
    const imageHeader = image.container.querySelector(`.${styles.CardHeader}`)

    expect(imageHeader).toHaveClass(styles.CardHeaderEdgeToEdge)

    image.unmount()

    const icon = render(() => (
      <Card>
        <Card.Icon icon={TestIcon} />
        <Card.Heading>With Icon</Card.Heading>
      </Card>
    ))
    const iconHeader = icon.container.querySelector(`.${styles.CardHeader}`)

    expect(iconHeader).not.toHaveClass(styles.CardHeaderEdgeToEdge)
  })

  it('accepts class and className on the root element', () => {
    const { container } = render(() => (
      <Card class="solid-class" className="react-class">
        <Card.Heading>Custom</Card.Heading>
      </Card>
    ))

    expect(container.firstChild).toHaveClass(styles.Card)
    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('forwards refs and passes data attributes', () => {
    let element: HTMLDivElement | undefined
    const { container } = render(() => (
      <Card ref={(node) => (element = node)} padding="none" borderRadius="medium">
        <Card.Heading>Ref Card</Card.Heading>
      </Card>
    ))

    expect(element).toBeInstanceOf(HTMLDivElement)
    expect(container.firstChild).toHaveAttribute('data-padding', 'none')
    expect(container.firstChild).toHaveAttribute('data-border-radius', 'medium')
  })

  it('renders arbitrary custom content when no subcomponents are used', () => {
    render(() => (
      <Card padding="none">
        <div data-testid="custom-content">
          <p>Custom paragraph</p>
        </div>
      </Card>
    ))

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByText('Custom paragraph')).toBeInTheDocument()
  })
})
