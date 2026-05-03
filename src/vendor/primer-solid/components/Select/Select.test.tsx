import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Select } from '../../index'

describe('Select', () => {
  it('renders a select input', () => {
    render(() => (
      <>
        <label for="choice">Choice</label>
        <Select id="choice">
          <Select.Option value="one">Choice one</Select.Option>
          <Select.Option value="two">Choice two</Select.Option>
        </Select>
      </>
    ))

    expect(screen.getByLabelText('Choice')).toBeInTheDocument()
  })

  it('renders a placeholder option', () => {
    render(() => (
      <>
        <label for="choice">Choice</label>
        <Select id="choice" placeholder="Pick a choice">
          <Select.Option value="one">Choice one</Select.Option>
          <Select.Option value="two">Choice two</Select.Option>
        </Select>
      </>
    ))

    const placeholder = screen.getByText('Pick a choice') as HTMLOptionElement

    expect(placeholder.selected).toBe(true)
    expect(placeholder.disabled).toBe(false)
    expect(placeholder.hidden).toBe(false)
  })

  it('marks a required placeholder option as disabled and hidden', () => {
    render(() => (
      <>
        <label for="choice">Choice</label>
        <Select id="choice" placeholder="Pick a choice" required>
          <Select.Option value="one">Choice one</Select.Option>
          <Select.Option value="two">Choice two</Select.Option>
        </Select>
      </>
    ))

    const placeholder = screen.getByText('Pick a choice') as HTMLOptionElement

    expect(placeholder.selected).toBe(true)
    expect(placeholder.disabled).toBe(true)
    expect(placeholder.hidden).toBe(true)
  })

  it('forwards change events', () => {
    const onChange = vi.fn()

    render(() => (
      <>
        <label for="choice">Choice</label>
        <Select id="choice" onChange={onChange}>
          <Select.Option value="one">Choice one</Select.Option>
          <Select.Option value="two">Choice two</Select.Option>
        </Select>
      </>
    ))

    const select = screen.getByLabelText('Choice') as HTMLSelectElement

    fireEvent.change(select, { target: { value: 'two' } })

    expect(onChange).toHaveBeenCalled()
    expect(select.value).toBe('two')
  })
})
