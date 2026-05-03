import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Checkbox, CheckboxGroup } from '../../index'

describe('CheckboxGroup', () => {
  it('renders an accessible labelled group', () => {
    render(() => (
      <CheckboxGroup>
        <CheckboxGroup.Label>Choices</CheckboxGroup.Label>
        <label>
          <Checkbox value="one" />
          Choice one
        </label>
        <label>
          <Checkbox value="two" />
          Choice two
        </label>
      </CheckboxGroup>
    ))

    expect(screen.getByRole('group', { name: 'Choices' })).toBeInTheDocument()
  })

  it('calls onChange with selected values', () => {
    const onChange = vi.fn()

    render(() => (
      <CheckboxGroup onChange={onChange}>
        <CheckboxGroup.Label>Choices</CheckboxGroup.Label>
        <label>
          <Checkbox value="one" />
          Choice one
        </label>
        <label>
          <Checkbox value="two" defaultChecked />
          Choice two
        </label>
      </CheckboxGroup>
    ))

    const checkbox = screen.getByLabelText('Choice one') as HTMLInputElement

    fireEvent.click(checkbox)
    expect(onChange).toHaveBeenLastCalledWith(
      ['two', 'one'],
      expect.objectContaining({
        target: expect.objectContaining({ value: 'one' }),
      }),
    )

    fireEvent.click(checkbox)
    expect(onChange).toHaveBeenLastCalledWith(
      ['two'],
      expect.objectContaining({
        target: expect.objectContaining({ value: 'one' }),
      }),
    )
  })

  it('disables descendant checkboxes', () => {
    render(() => (
      <CheckboxGroup disabled>
        <CheckboxGroup.Label>Choices</CheckboxGroup.Label>
        <label>
          <Checkbox value="one" />
          Choice one
        </label>
      </CheckboxGroup>
    ))

    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
