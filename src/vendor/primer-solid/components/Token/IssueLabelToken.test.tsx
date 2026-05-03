import { fireEvent, render, screen } from '@solidjs/testing-library'
import { IssueLabelToken } from './IssueLabelToken'
import issueStyles from './IssueLabelToken.module.css'
import tokenStyles from './TokenBase.module.css'

describe('IssueLabelToken', () => {
  it('renders a token with text and default color variables', () => {
    const { container } = render(() => <IssueLabelToken text="token" />)
    const token = container.firstChild as HTMLElement

    expect(token.nodeName).toBe('SPAN')
    expect(token).toHaveClass(tokenStyles.TokenBase)
    expect(token).toHaveClass(issueStyles.IssueLabel)
    expect(token).toHaveAttribute('data-size', 'medium')
    expect(token.style.getPropertyValue('--label-r')).toBe('153')
    expect(screen.getByText('token')).toBeInTheDocument()
  })

  it('parses custom fillColor into css variables', () => {
    const { container } = render(() => (
      <IssueLabelToken text="token" fillColor="#0366d6" />
    ))
    const token = container.firstChild as HTMLElement

    expect(token.style.getPropertyValue('--label-r')).toBe('3')
    expect(token.style.getPropertyValue('--label-g')).toBe('102')
    expect(token.style.getPropertyValue('--label-b')).toBe('214')
    expect(token.style.getPropertyValue('--label-h')).toBe('212')
    expect(token.style.getPropertyValue('--label-s')).toBe('97')
    expect(token.style.getPropertyValue('--label-l')).toBe('43')
  })

  it('renders a remove button and calls onRemove from click and keyboard', () => {
    const onRemove = vi.fn()
    const { container } = render(() => (
      <IssueLabelToken text="token" onRemove={onRemove} />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Remove token' }))
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Backspace' })
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Delete' })

    expect(onRemove).toHaveBeenCalledTimes(3)
  })

  it('hides the remove button when hideRemoveButton is true', () => {
    render(() => (
      <IssueLabelToken text="token" onRemove={() => {}} hideRemoveButton />
    ))

    expect(screen.queryByRole('button', { name: 'Remove token' })).toBeNull()
  })

  it('puts interactive props on the text target when token and remove button are both interactive', () => {
    const { container } = render(() => (
      <IssueLabelToken as="a" href="/issues" text="token" onRemove={() => {}} />
    ))

    const token = container.firstChild as HTMLElement
    const link = screen.getByText('token')

    expect(token.nodeName).toBe('SPAN')
    expect(link.nodeName).toBe('A')
    expect(link).toHaveAttribute('href', '/issues')
    expect(
      token.querySelector('[data-has-multiple-action-targets="true"]'),
    ).toHaveAttribute('aria-hidden', 'true')
  })
})
