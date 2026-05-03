import { createMemo, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { parseToHsla, parseToRgba } from 'color2k'
import { mergeClassNames, mergeStyles } from '../../utils'
import TokenBase, {
  defaultTokenSize,
  isTokenInteractive,
  type TokenBaseProps,
} from './TokenBase'
import RemoveTokenButton from './_RemoveTokenButton'
import TokenTextContainer from './_TokenTextContainer'
import styles from './IssueLabelToken.module.css'

export interface IssueLabelTokenProps extends TokenBaseProps {
  fillColor?: string
}

export function IssueLabelToken(props: IssueLabelTokenProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'class',
    'className',
    'fillColor',
    'hideRemoveButton',
    'href',
    'id',
    'isSelected',
    'onClick',
    'onRemove',
    'size',
    'style',
    'text',
  ])

  const fillColor = () => local.fillColor ?? '#999'
  const size = () => local.size ?? defaultTokenSize
  const hasRemoveButton = () =>
    !local.hideRemoveButton && Boolean(local.onRemove)
  const hasMultipleActionTargets = () =>
    isTokenInteractive(props) &&
    Boolean(local.onRemove) &&
    !local.hideRemoveButton

  const interactiveTokenProps = () => ({
    as: local.as,
    href: local.href,
    onClick: local.onClick,
  })

  const customProperties = createMemo(() => {
    const [r, g, b] = parseToRgba(fillColor())
    const [h, s, l] = parseToHsla(fillColor())

    return {
      '--label-r': String(r),
      '--label-g': String(g),
      '--label-b': String(b),
      '--label-h': String(Math.round(h)),
      '--label-s': String(Math.round(s * 100)),
      '--label-l': String(Math.round(l * 100)),
    } as JSX.CSSProperties
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
      isSelected={local.isSelected}
      class={mergeClassNames(styles.IssueLabel, local.className, local.class)}
      text={local.text}
      size={size()}
      style={mergeStyles(customProperties(), local.style)}
      data-has-remove-button={hasRemoveButton()}
      data-selected={local.isSelected}
      {...(!hasMultipleActionTargets() ? interactiveTokenProps() : {})}
      {...rest}
    >
      <TokenTextContainer
        {...(hasMultipleActionTargets() ? interactiveTokenProps() : {})}
      >
        {local.text}
      </TokenTextContainer>
      {hasRemoveButton() ? (
        <RemoveTokenButton
          borderOffset={1}
          onClick={onRemoveClick}
          size={size()}
          aria-hidden={hasMultipleActionTargets() ? 'true' : 'false'}
          isParentInteractive={isTokenInteractive(props)}
          data-has-multiple-action-targets={hasMultipleActionTargets()}
          class={styles.RemoveButton}
        />
      ) : null}
    </TokenBase>
  )
}

export default IssueLabelToken
