import { render, screen } from '@solidjs/testing-library'
import { Flash } from './Flash'
import styles from './Flash.module.css'

describe('Flash', () => {
  it('renders a <div> by default', () => {
    const { container } = render(() => <Flash />)

    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Flash class="solid-class" className="react-class" />
    ))

    expect(container.firstChild).toHaveClass(styles.Flash)
    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('renders as a different element when as prop is provided', () => {
    const { container } = render(() => <Flash as="section">Notice</Flash>)

    expect(container.firstChild?.nodeName).toBe('SECTION')
  })

  it('supports the `full` prop', () => {
    render(() => (
      <>
        <Flash data-testid="full" full />
        <Flash data-testid="no-full" />
      </>
    ))

    expect(screen.getByTestId('full')).toHaveAttribute('data-full', '')
    expect(screen.getByTestId('no-full')).not.toHaveAttribute('data-full')
  })

  it('supports the `variant` prop', () => {
    render(() => (
      <>
        <Flash data-testid="danger" variant="danger" />
        <Flash data-testid="success" variant="success" />
        <Flash data-testid="warning" variant="warning" />
        <Flash data-testid="default" variant="default" />
        <Flash data-testid="implicit-default" />
      </>
    ))

    expect(screen.getByTestId('danger')).toHaveAttribute(
      'data-variant',
      'danger',
    )
    expect(screen.getByTestId('success')).toHaveAttribute(
      'data-variant',
      'success',
    )
    expect(screen.getByTestId('warning')).toHaveAttribute(
      'data-variant',
      'warning',
    )
    expect(screen.getByTestId('default')).toHaveAttribute(
      'data-variant',
      'default',
    )
    expect(screen.getByTestId('implicit-default')).toHaveAttribute(
      'data-variant',
      'default',
    )
  })

  it('passes through other props', () => {
    const { container } = render(() => <Flash data-testid="test" />)

    expect(container.firstChild).toHaveAttribute('data-testid', 'test')
  })
})
