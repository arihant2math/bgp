import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Link } from '../Link'
import { Breadcrumb, Breadcrumbs } from './Breadcrumbs'

let resizeObserverCallback:
  | ((entries: Array<{ contentRect: { width: number; height: number } }>) => void)
  | undefined

class MockResizeObserver {
  constructor(
    callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void,
  ) {
    resizeObserverCallback = callback
  }

  observe() {}
  disconnect() {}
}

describe('Breadcrumbs', () => {
  beforeEach(() => {
    resizeObserverCallback = undefined
    ;(globalThis as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver
  })

  it('renders a nav with breadcrumb items', () => {
    const { container } = render(() => (
      <Breadcrumbs>
        <Breadcrumbs.Item href="/home">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/docs">Docs</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/components" selected>
          Components
        </Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    expect(container.firstChild?.nodeName).toBe('NAV')
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Docs')).toBeInTheDocument()
    expect(screen.getByText('Components')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('supports the deprecated Breadcrumb alias', () => {
    render(() => (
      <Breadcrumb>
        <Breadcrumb.Item href="/home">Home</Breadcrumb.Item>
      </Breadcrumb>
    ))

    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Breadcrumbs',
    )
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('renders all items in wrap mode', () => {
    render(() => (
      <Breadcrumbs overflow="wrap">
        <Breadcrumbs.Item href="/1">Item 1</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/2">Item 2</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/3">Item 3</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/4">Item 4</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/5">Item 5</Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    expect(screen.queryByRole('button', { name: /more breadcrumb items/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item 5' })).toBeInTheDocument()
  })

  it('renders an overflow menu in menu mode', () => {
    render(() => (
      <Breadcrumbs overflow="menu">
        <Breadcrumbs.Item href="/1">Item 1</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/2">Item 2</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/3">Item 3</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/4">Item 4</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/5">Item 5</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/6">Item 6</Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    expect(
      screen.getByRole('button', { name: /more breadcrumb items/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Item 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Item 2' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item 3' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item 6' })).toBeInTheDocument()
  })

  it('shows only the current page on narrow menu layouts', () => {
    render(() => (
      <Breadcrumbs overflow="menu">
        <Breadcrumbs.Item href="/1">Item 1</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/2">Item 2</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/3">Item 3</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/4">Item 4</Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    resizeObserverCallback?.([{ contentRect: { width: 320, height: 40 } }])

    expect(
      screen.getByRole('button', { name: /more breadcrumb items/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Item 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Item 2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Item 3' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item 4' })).toBeInTheDocument()
  })

  it('keeps the root breadcrumb visible in menu-with-root mode', () => {
    render(() => (
      <Breadcrumbs overflow="menu-with-root">
        <Breadcrumbs.Item href="/home">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/category">Category</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/subcategory">Subcategory</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/product">Product</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/details">Details</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/reviews" selected>
          Reviews
        </Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /more breadcrumb items/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens and closes the overflow menu with click, outside click, and escape', () => {
    render(() => (
      <div>
        <button type="button">Outside</button>
        <Breadcrumbs overflow="menu">
          <Breadcrumbs.Item href="/1">Item 1</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/2">Item 2</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/3">Item 3</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/4">Item 4</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/5">Item 5</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/6">Item 6</Breadcrumbs.Item>
        </Breadcrumbs>
      </div>
    ))

    const menuButton = screen.getByRole('button', {
      name: /more breadcrumb items/i,
    })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Item 1' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Outside' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('supports polymorphic items and passes props through the overflow menu', () => {
    render(() => (
      <Breadcrumbs overflow="menu">
        <Breadcrumbs.Item as={Link} href="/home" data-testid="home-link" inline>
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href="/2">Item 2</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/3">Item 3</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/4">Item 4</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/5">Item 5</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/6">Item 6</Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    fireEvent.click(
      screen.getByRole('button', { name: /more breadcrumb items/i }),
    )

    const homeLink = screen.getByTestId('home-link')
    expect(homeLink).toHaveAttribute('href', '/home')
    expect(homeLink).toHaveAttribute('data-inline', 'true')
  })

  it('supports non-anchor polymorphism', () => {
    render(() => (
      <Breadcrumbs>
        <Breadcrumbs.Item as="span">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item as="span" selected>
          Docs
        </Breadcrumbs.Item>
      </Breadcrumbs>
    ))

    expect(screen.getByText('Home').nodeName).toBe('SPAN')
    expect(screen.getByText('Docs').nodeName).toBe('SPAN')
    expect(screen.getByText('Docs')).toHaveAttribute('aria-current', 'page')
  })
})
