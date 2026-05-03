import { render } from '@solidjs/testing-library'
import { Link } from './Link'
import styles from './Link.module.css'

describe('Link', () => {
  it('renders an anchor by default and passes href through', () => {
    const { container } = render(() => <Link href="https://github.com" />)

    expect(container.firstChild?.nodeName).toBe('A')
    expect(container.firstChild).toHaveClass(styles.Link)
    expect(container.firstChild).toHaveAttribute('href', 'https://github.com')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Link class="solid-class" className="react-class" href="#" />
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('renders as a different element when as prop is provided', () => {
    const { container } = render(() => <Link as="button">Test</Link>)

    expect(container.firstChild?.nodeName).toBe('BUTTON')
  })

  it('sets muted and inline data attributes without leaking props', () => {
    const { container } = render(() => (
      <Link muted inline href="#">
        Test
      </Link>
    ))

    expect(container.firstChild).toHaveAttribute('data-muted', 'true')
    expect(container.firstChild).toHaveAttribute('data-inline', 'true')
    expect(container.firstChild).not.toHaveAttribute('muted')
    expect(container.firstChild).not.toHaveAttribute('inline')
  })

  it('resolves hoverColor tokens into a hover color css variable', () => {
    const { container } = render(() => <Link hoverColor="accent.fg" href="#" />)
    const link = container.firstChild as HTMLElement

    expect(link).toHaveAttribute('data-hover-color', 'accent.fg')
    expect(link.style.getPropertyValue('--primer-solid-link-hoverColor')).toBe(
      'var(--fgColor-accent)',
    )
  })

  it('forwards refs', () => {
    let element: HTMLAnchorElement | undefined
    render(() => <Link ref={(node) => (element = node)} href="#" />)

    expect(element?.nodeName).toBe('A')
  })

  it('logs a warning when rendering an inaccessible element', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(() => <Link as="i" />)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error: Found `Link` component that renders an inaccessible element',
      expect.any(HTMLElement),
      'Please ensure `Link` always renders as <a> or <button>',
    )

    consoleSpy.mockRestore()
  })

  it('sets the Link data-component attribute', () => {
    const { container } = render(() => <Link href="#">Test</Link>)

    expect(container.querySelector('[data-component="Link"]')).toBeInTheDocument()
  })
})
