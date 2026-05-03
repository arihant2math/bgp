import { fireEvent, render, screen } from '@solidjs/testing-library'
import { vi } from 'vitest'
import { TextInput } from './index'

const SearchIcon = (props: Record<string, unknown>) => (
  <svg viewBox="0 0 16 16" {...props}>
    <path d="M11.5 10h-.79l-.28-.27a5 5 0 1 0-.71.71l.27.28v.79L14 15.5 15.5 14l-4-4ZM6.5 10a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
  </svg>
)

const ComponentVisual = () => (
  <span data-testid="component-visual">Leading</span>
)

describe('TextInput', () => {
  it('renders a text input by default', () => {
    render(() => <TextInput name="zipcode" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'zipcode')
  })

  it('renders size and block data attributes on the wrapper', () => {
    const { container } = render(() => (
      <TextInput name="zipcode" size="small" block />
    ))

    expect(container.firstElementChild).toHaveAttribute('data-size', 'small')
    expect(container.firstElementChild).toHaveAttribute('data-block')
  })

  it('sets aria-invalid on error unless a prop is already provided', () => {
    const first = render(() => (
      <TextInput validationStatus="error" data-testid="input" />
    ))

    expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true')

    first.unmount()

    render(() => (
      <TextInput
        validationStatus="error"
        aria-invalid="false"
        data-testid="input"
      />
    ))

    expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'false')
  })

  it('renders component and element visuals', () => {
    render(() => (
      <>
        <TextInput leadingVisual={ComponentVisual} />
        <TextInput
          trailingVisual={<span data-testid="jsx-visual">Trailing</span>}
        />
      </>
    ))

    expect(screen.getByTestId('component-visual')).toBeInTheDocument()
    expect(
      screen.getByTestId('component-visual').closest('[data-component]'),
    ).toHaveAttribute('data-component', 'TextInput.LeadingVisual')
    expect(screen.getByTestId('jsx-visual')).toBeInTheDocument()
    expect(
      screen.getByTestId('jsx-visual').closest('[data-component]'),
    ).toHaveAttribute('data-component', 'TextInput.TrailingVisual')
    expect(screen.getAllByRole('textbox')[0]).toHaveAttribute(
      'aria-describedby',
    )
  })

  it('renders trailing text and icon actions', () => {
    const handleTextAction = vi.fn()
    const handleIconAction = vi.fn()

    render(() => (
      <>
        <TextInput
          trailingAction={
            <TextInput.Action
              onClick={handleTextAction}
              aria-label="Clear input"
            >
              Clear
            </TextInput.Action>
          }
        />
        <TextInput
          trailingAction={
            <TextInput.Action
              onClick={handleIconAction}
              icon={SearchIcon}
              aria-label="Search"
            />
          }
        />
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(handleTextAction).toHaveBeenCalledTimes(1)
    expect(handleIconAction).toHaveBeenCalledTimes(1)
  })

  it('focuses the input when clicking non-interactive wrapper content', () => {
    render(() => (
      <>
        <label for="search-input">Search</label>
        <TextInput id="search-input" trailingVisual={SearchIcon} />
      </>
    ))

    const input = screen.getByLabelText('Search')
    const icon = document.querySelector('svg')

    expect(input).not.toBe(document.activeElement)
    fireEvent.click(icon as SVGElement)
    expect(input).toBe(document.activeElement)
  })

  it('uses onInput semantics for the onChange prop', () => {
    const onChange = vi.fn()
    render(() => <TextInput onChange={onChange} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'test' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(input.value).toBe('test')
  })

  it('merges visual and loading descriptions with passed aria-describedby', () => {
    render(() => (
      <>
        <span id="passed-value">value</span>
        <TextInput
          aria-describedby="passed-value"
          leadingVisual="leading"
          trailingVisual="trailing"
          loading
          loaderText="Loading search results"
        />
      </>
    ))

    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-describedby')).toContain('passed-value')
    expect(input).toHaveAccessibleDescription(
      'value leading trailing Loading search results',
    )
  })

  it('renders character counter state and validation', () => {
    render(() => <TextInput characterLimit={5} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'Hello World' } })

    expect(screen.getByText('6 characters over')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(
      document.querySelector(
        '[data-component="TextInput.CharacterCounter"] svg',
      ),
    ).toBeInTheDocument()
  })

  it('renders character counter screen reader helpers', () => {
    vi.useFakeTimers()

    render(() => <TextInput characterLimit={10} defaultValue="Hello" />)

    const status = document.querySelector('[aria-live="polite"]')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveTextContent('')
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'You can enter up to 10 characters',
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'Hello!' } })
    vi.runAllTimers()

    expect(status).toHaveTextContent('4 characters remaining')

    vi.useRealTimers()
  })

  it('renders data-component attributes', () => {
    render(() => (
      <TextInput
        icon={SearchIcon}
        leadingVisual="leading"
        trailingVisual="trailing"
        characterLimit={10}
        trailingAction={
          <TextInput.Action aria-label="Clear">Clear</TextInput.Action>
        }
      />
    ))

    expect(
      document.querySelector('[data-component="TextInput"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="input"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="TextInput.Icon"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="TextInput.LeadingVisual"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="TextInput.TrailingVisual"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="TextInput.Action"]'),
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-component="TextInput.CharacterCounter"]'),
    ).toBeInTheDocument()
  })
})
