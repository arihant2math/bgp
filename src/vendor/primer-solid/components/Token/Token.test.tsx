import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Token } from './Token'
import styles from './Token.module.css'
import baseStyles from './TokenBase.module.css'

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

describe('Token', () => {
  it('renders a token with text', () => {
    const { container } = render(() => <Token text="token" />)
    const token = container.firstChild as HTMLElement

    expect(token.nodeName).toBe('SPAN')
    expect(token).toHaveClass(baseStyles.TokenBase)
    expect(token).toHaveClass(styles.Token)
    expect(token).toHaveAttribute('data-size', 'medium')
    expect(token).toHaveAttribute('data-cursor-is-interactive', 'false')
    expect(screen.getByText('token')).toBeInTheDocument()
  })

  it('renders a remove button and calls onRemove from click and keyboard', () => {
    const onRemove = vi.fn()
    const { container } = render(() => (
      <Token text="token" onRemove={onRemove} />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Remove token' }))
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Backspace' })
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Delete' })

    expect(onRemove).toHaveBeenCalledTimes(3)
  })

  it('hides the remove button when hideRemoveButton is true', () => {
    render(() => <Token text="token" onRemove={() => {}} hideRemoveButton />)

    expect(screen.queryByRole('button', { name: 'Remove token' })).toBeNull()
  })

  it('puts interactive props on the text target when token and remove button are both interactive', () => {
    const { container } = render(() => (
      <Token as="a" href="/issues" text="token" onRemove={() => {}} />
    ))

    const token = container.firstChild as HTMLElement
    const link = screen.getByText('token')

    expect(token.nodeName).toBe('SPAN')
    expect(link.nodeName).toBe('A')
    expect(link).toHaveAttribute('href', '/issues')
    expect(token).toHaveAttribute('data-cursor-is-interactive', 'false')
    expect(token.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('renders the leadingVisual for non-small tokens', () => {
    const { container } = render(() => (
      <Token text="token" leadingVisual={CheckIcon} size="large" />
    ))

    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(
      container.querySelector(`.${styles.LeadingVisualContainer}`),
    ).toBeInTheDocument()
    expect(
      container.querySelector(`.${styles.LargeLeadingVisual}`),
    ).toBeInTheDocument()
  })

  it('does not render the leadingVisual for small tokens', () => {
    const { container } = render(() => (
      <Token text="token" leadingVisual={CheckIcon} size="small" />
    ))

    expect(container.querySelector('svg')).toBeNull()
  })

  it('marks button and click-interactive tokens as interactive', () => {
    const button = render(() => <Token as="button" text="token" />)
    expect(button.container.firstChild).toHaveAttribute(
      'data-cursor-is-interactive',
      'true',
    )

    const clickable = render(() => <Token text="token" onClick={() => {}} />)
    expect(clickable.container.firstChild).toHaveAttribute(
      'data-cursor-is-interactive',
      'true',
    )
  })
})
