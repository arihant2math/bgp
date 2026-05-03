import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Radio, RadioGroup } from '../../index'

describe('RadioGroup', () => {
  it('renders an accessible labelled group', () => {
    render(() => (
      <RadioGroup name="choices">
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <label>
          <Radio value="one" />
          Choice one
        </label>
        <label>
          <Radio value="two" />
          Choice two
        </label>
      </RadioGroup>
    ))

    expect(screen.getByRole('group', { name: 'Choices' })).toBeInTheDocument()
  })

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn()

    render(() => (
      <RadioGroup name="choices" onChange={onChange}>
        <RadioGroup.Label>Choices</RadioGroup.Label>
        <label>
          <Radio value="one" />
          Choice one
        </label>
        <label>
          <Radio value="two" />
          Choice two
        </label>
      </RadioGroup>
    ))

    fireEvent.click(screen.getByLabelText('Choice one'))

    expect(onChange).toHaveBeenLastCalledWith(
      'one',
      expect.objectContaining({
        target: expect.objectContaining({ value: 'one' }),
      }),
    )
  })
})
