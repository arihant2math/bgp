import { splitProps } from 'solid-js'
import type { JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames, mergeStyles } from '../../utils'
import { VisuallyHidden } from '../VisuallyHidden'
import TokenBase, {
  defaultTokenSize,
  isTokenInteractive,
  type TokenBaseProps,
} from './TokenBase'
import RemoveTokenButton from './_RemoveTokenButton'
import TokenTextContainer from './_TokenTextContainer'
import styles from './Token.module.css'

export interface TokenProps extends TokenBaseProps {
  leadingVisual?: JSX.Element | ValidComponent
}

const tokenBorderWidthPx = 1

function renderLeadingVisual(leadingVisual: TokenProps['leadingVisual']) {
  if (typeof leadingVisual === 'function') {
    return <Dynamic component={leadingVisual as ValidComponent} />
  }

  return leadingVisual
}

function LeadingVisualContainer(props: {
  size?: TokenBaseProps['size']
  children?: JSX.Element
}) {
  return (
    <div
      class={mergeClassNames(
        styles.LeadingVisualContainer,
        props.size && ['large', 'xlarge'].includes(props.size)
          ? styles.LargeLeadingVisual
          : undefined,
      )}
    >
      {props.children}
    </div>
  )
}

export function Token(props: TokenProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'class',
    'className',
    'hideRemoveButton',
    'href',
    'id',
    'isSelected',
    'leadingVisual',
    'onClick',
    'onRemove',
    'size',
    'style',
    'text',
  ])

  const size = () => local.size ?? defaultTokenSize
  const hasRemoveButton = () =>
    !local.hideRemoveButton && Boolean(local.onRemove)
  const hasMultipleActionTargets = () =>
    isTokenInteractive(props) && hasRemoveButton()

  const interactiveTokenProps = () => ({
    as: local.as,
    href: local.href,
    onClick: local.onClick,
  })

  const onRemoveClick: JSX.EventHandler<
    HTMLButtonElement | HTMLSpanElement,
    MouseEvent
  > = (event) => {
    event.stopPropagation()
    local.onRemove?.()
  }

  return (
    <TokenBase
      onRemove={local.onRemove}
      id={local.id?.toString()}
      class={mergeClassNames(styles.Token, local.className, local.class)}
      text={local.text}
      size={size()}
      data-is-selected={local.isSelected}
      data-is-remove-btn={hasRemoveButton()}
      {...(!hasMultipleActionTargets() ? interactiveTokenProps() : {})}
      {...rest}
      style={mergeStyles(
        { 'border-width': `${tokenBorderWidthPx}px` },
        local.style,
      )}
    >
      {local.leadingVisual && size() !== 'small' ? (
        <LeadingVisualContainer size={size()}>
          {renderLeadingVisual(local.leadingVisual)}
        </LeadingVisualContainer>
      ) : null}

      <TokenTextContainer
        {...(hasMultipleActionTargets() ? interactiveTokenProps() : {})}
      >
        {local.text}
        {local.onRemove ? (
          <VisuallyHidden>
            {' '}
            (press backspace or delete to remove)
          </VisuallyHidden>
        ) : null}
      </TokenTextContainer>

      {hasRemoveButton() ? (
        <RemoveTokenButton
          borderOffset={tokenBorderWidthPx}
          onClick={onRemoveClick}
          size={size()}
          isParentInteractive={isTokenInteractive(props)}
          aria-hidden={hasMultipleActionTargets() ? 'true' : 'false'}
        />
      ) : null}
    </TokenBase>
  )
}

export default Token
