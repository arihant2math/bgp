import { render } from '@solidjs/testing-library'
import { IssueLabel } from './IssueLabel'
import styles from './IssueLabel.module.css'

describe('IssueLabel', () => {
  it('renders a span by default', () => {
    const { container } = render(() => <IssueLabel>Label</IssueLabel>)

    expect(container.firstChild?.nodeName).toBe('SPAN')
    expect(container.firstChild).toHaveClass(styles.IssueLabel)
    expect(container.firstChild).toHaveAttribute('data-variant', 'gray')
  })

  it('renders a button when onClick is provided', () => {
    const { container } = render(() => (
      <IssueLabel onClick={() => {}}>Label</IssueLabel>
    ))

    expect(container.firstChild?.nodeName).toBe('BUTTON')
    expect(container.firstChild).toHaveAttribute('type', 'button')
  })

  it('renders an anchor when href is provided', () => {
    const { container } = render(() => (
      <IssueLabel href="/issues">Label</IssueLabel>
    ))

    expect(container.firstChild?.nodeName).toBe('A')
    expect(container.firstChild).toHaveAttribute('href', '/issues')
  })

  it('renders as a custom element when as is provided', () => {
    const { container } = render(() => <IssueLabel as="div">Label</IssueLabel>)

    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('uses fillColor inline styles instead of a variant', () => {
    const { container } = render(() => (
      <IssueLabel fillColor="#59B200">Label</IssueLabel>
    ))

    expect(container.firstChild).not.toHaveAttribute('data-variant')
    expect(container.firstChild).toHaveStyle({
      'background-color': '#59B200',
      color: '#000',
    })
  })

  it('accepts class, className, style, and data attributes', () => {
    const { container } = render(() => (
      <IssueLabel
        class="solid-class"
        className="react-class"
        style={{ color: 'red' }}
        data-testid="label"
      >
        Label
      </IssueLabel>
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
    expect(container.firstChild).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(container.firstChild).toHaveAttribute('data-testid', 'label')
  })
})
