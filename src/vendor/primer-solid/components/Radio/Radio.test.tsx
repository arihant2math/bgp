import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Radio } from '../../index'

describe('Radio', () => {
  it('renders a radio input', () => {
    render(() => <Radio name="choices" value="one" />)

    expect(screen.getByRole('radio')).toBeInTheDocument()
  })

  it('supports grouping by name', () => {
    const onChange = vi.fn()

    render(() => (
      <form>
        <Radio name="choices" value="one" onChange={onChange} />
        <Radio name="choices" value="two" onChange={onChange} />
      </form>
    ))

    const [one, two] = screen.getAllByRole('radio') as HTMLInputElement[]

    fireEvent.click(one)
    expect(one.checked).toBe(true)
    expect(two.checked).toBe(false)

    fireEvent.click(two)
    expect(one.checked).toBe(false)
    expect(two.checked).toBe(true)
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
