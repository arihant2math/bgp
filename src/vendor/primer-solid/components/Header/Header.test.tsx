import { render, screen } from '@solidjs/testing-library'
import { Header } from './Header'
import styles from './Header.module.css'

describe('Header', () => {
  it('renders a <header> by default', () => {
    const { container } = render(() => <Header />)

    expect(container.firstChild?.nodeName).toBe('HEADER')
    expect(container.firstChild).toHaveClass(styles.Header)
  })

  it('renders as a different element when as prop is provided', () => {
    const { container } = render(() => <Header as="div" />)

    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('passes through attributes', () => {
    const { container } = render(() => <Header aria-label="Test label" />)

    expect(container.firstChild).toHaveAttribute('aria-label', 'Test label')
  })

  it('forwards refs', () => {
    let element: HTMLElement | undefined
    render(() => <Header ref={(node) => (element = node)} />)

    expect(element?.nodeName).toBe('HEADER')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Header class="solid-class" className="react-class" />
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  describe('Header.Item', () => {
    it('renders children and applies the HeaderItem class', () => {
      render(() => <Header.Item>Menu</Header.Item>)

      expect(screen.getByText('Menu')).toHaveClass(styles.HeaderItem)
    })

    it('sets data-full only when full is true', () => {
      const { container } = render(() => (
        <>
          <Header.Item full>Full</Header.Item>
          <Header.Item>Regular</Header.Item>
        </>
      ))
      const [full, regular] = Array.from(container.children)

      expect(full).toHaveAttribute('data-full')
      expect(regular).not.toHaveAttribute('data-full')
    })

    it('forwards refs', () => {
      let element: HTMLDivElement | undefined
      render(() => <Header.Item ref={(node) => (element = node)} />)

      expect(element?.nodeName).toBe('DIV')
    })
  })

  describe('Header.Link', () => {
    it('renders an <a> by default', () => {
      const { container } = render(() => <Header.Link href="#">Home</Header.Link>)

      expect(container.firstChild?.nodeName).toBe('A')
      expect(container.firstChild).toHaveClass(styles.HeaderLink)
      expect(container.firstChild).toHaveAttribute('href', '#')
    })

    it('renders as a different element when as prop is provided', () => {
      const { container } = render(() => <Header.Link as="button">Home</Header.Link>)

      expect(container.firstChild?.nodeName).toBe('BUTTON')
    })

    it('passes through to and forwards refs', () => {
      let element: HTMLAnchorElement | undefined
      const { container } = render(() => (
        <Header.Link ref={(node) => (element = node)} to="/dashboard" />
      ))

      expect(container.firstChild).toHaveAttribute('to', '/dashboard')
      expect(element?.nodeName).toBe('A')
    })
  })
})
