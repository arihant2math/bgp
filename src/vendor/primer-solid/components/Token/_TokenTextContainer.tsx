import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import type { TokenBaseProps } from './TokenBase'
import styles from './_TokenTextContainer.module.css'

type TokenTextContainerProps = Partial<TokenBaseProps> & {
  children?: JSX.Element
}

export function TokenTextContainer(props: TokenTextContainerProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
    'id',
  ])

  return (
    <Dynamic
      component={local.as ?? 'span'}
      {...(rest as Record<string, unknown>)}
      class={mergeClassNames(
        styles.TokenTextContainer,
        local.className,
        local.class,
      )}
      id={local.id?.toString()}
    >
      {local.children}
    </Dynamic>
  )
}

export default TokenTextContainer
