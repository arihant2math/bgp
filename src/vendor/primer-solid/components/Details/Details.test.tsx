import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Button } from '../Button'
import { useDetails } from '../../hooks'
import { Details } from './Details'
import styles from './Details.module.css'

describe('Details', () => {
  it('renders a <details> and applies the Details class', () => {
    const { container } = render(() => (
      <Details>
        <Details.Summary>Summary</Details.Summary>
      </Details>
    ))

    expect(container.firstChild?.nodeName).toBe('DETAILS')
    expect(container.firstChild).toHaveClass(styles.Details)
  })

  it('forwards refs', () => {
    let element: HTMLDetailsElement | undefined
    render(() => (
      <Details ref={(node) => (element = node)}>
        <Details.Summary>Summary</Details.Summary>
      </Details>
    ))

    expect(element?.nodeName).toBe('DETAILS')
  })

  it('accepts class and className', () => {
    const { container } = render(() => (
      <Details class="solid-class" className="react-class">
        <Details.Summary>Summary</Details.Summary>
      </Details>
    ))

    expect(container.firstChild).toHaveClass('solid-class')
    expect(container.firstChild).toHaveClass('react-class')
  })

  it('closes when clicking outside', async () => {
    const Component = () => {
      const { getDetailsProps } = useDetails({
        closeOnOutsideClick: true,
        defaultOpen: true,
      })

      return (
        <Details data-testid="details" {...getDetailsProps()}>
          <Details.Summary>Summary</Details.Summary>
        </Details>
      )
    }

    render(() => <Component />)

    expect(screen.getByTestId('details')).toHaveAttribute('open')

    fireEvent.click(document.body)

    expect(screen.getByTestId('details')).not.toHaveAttribute('open')
  })

  it('can manipulate state with setOpen', () => {
    const Component = () => {
      const { getDetailsProps, setOpen, open } = useDetails({ defaultOpen: true })

      return (
        <Details data-testid="details" {...getDetailsProps()}>
          <summary data-testid="summary">{open() ? 'Open' : 'Closed'}</summary>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Details>
      )
    }

    render(() => <Component />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.getByTestId('summary')).toHaveTextContent('Closed')
    expect(screen.getByTestId('details')).not.toHaveAttribute('open')
  })

  it('does not close when clicking inside', () => {
    const Component = () => {
      const { getDetailsProps, open } = useDetails({
        closeOnOutsideClick: true,
        defaultOpen: true,
      })

      return (
        <Details {...getDetailsProps()}>
          <summary data-testid="summary">{open() ? 'Open' : 'Closed'}</summary>
          <div>
            <Button variant="primary">test</Button>
          </div>
        </Details>
      )
    }

    render(() => <Component />)

    fireEvent.click(screen.getByRole('button', { name: 'test' }))

    expect(screen.getByTestId('summary')).toHaveTextContent('Open')
  })

  describe('Details.Summary', () => {
    it('renders a <summary> by default', () => {
      const { container } = render(() => <Details.Summary>Summary</Details.Summary>)

      expect(container.firstChild?.nodeName).toBe('SUMMARY')
    })

    it('supports a custom className on the container element', () => {
      render(() => (
        <Details.Summary className="custom-class">test summary</Details.Summary>
      ))

      expect(screen.getByText('test summary')).toHaveClass('custom-class')
    })

    it('passes extra props onto the container element', () => {
      render(() => <Details.Summary data-testid="test">test summary</Details.Summary>)

      expect(screen.getByText('test summary')).toHaveAttribute('data-testid', 'test')
    })
  })
})
