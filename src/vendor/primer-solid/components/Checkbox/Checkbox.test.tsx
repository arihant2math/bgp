import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Checkbox } from '../../index'

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(() => <Checkbox />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('supports uncontrolled changes', () => {
    const onChange = vi.fn()

    render(() => <Checkbox onChange={onChange} />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement

    expect(checkbox.checked).toBe(false)
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalled()
    expect(checkbox.checked).toBe(true)
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  it('renders indeterminate state', () => {
    render(() => <Checkbox indeterminate checked />)

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement

    expect(checkbox.indeterminate).toBe(true)
    expect(checkbox.checked).toBe(false)
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed')
  })
})
