import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { mergeClassNames } from '../../utils'
import styles from './Card.module.css'

export type CardPadding = 'none' | 'condensed' | 'normal'
export type CardBorderRadius = 'medium' | 'large'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

export type CardProps = DistributiveOmit<
  ComponentProps<'div'>,
  'children' | 'class' | 'className' | 'padding'
> & {
  /**
   * Provide an optional class to add to the outermost element rendered by the Card.
   */
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  children?: JSX.Element
  /**
   * Controls the internal padding of the Card.
   * @default 'normal'
   */
  padding?: CardPadding
  /**
   * Controls the border radius of the Card.
   * @default 'large'
   */
  borderRadius?: CardBorderRadius
}

type HeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export type CardHeadingProps = JSX.HTMLAttributes<HTMLHeadingElement> & {
  /** The heading level to render. Defaults to 'h3'. */
  as?: HeadingLevel
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type CardDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type CardIconProps = {
  /** An Octicon or custom SVG icon to render. */
  icon: ValidComponent
  /** Accessible label for the icon. When omitted, the icon is treated as decorative. */
  'aria-label'?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type CardImageProps = JSX.ImgHTMLAttributes<HTMLImageElement> & {
  /** The image source URL. */
  src: string
  /** Alt text for accessibility. */
  alt?: string
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

export type CardMenuProps = {
  children?: JSX.Element
}

export type CardMetadataProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
}

type CardSlotType =
  | 'icon'
  | 'image'
  | 'heading'
  | 'description'
  | 'metadata'
  | 'menu'

const CARD_SLOT = Symbol('primer-solid.card-slot')

type CardSlot = {
  readonly [CARD_SLOT]: true
  type: CardSlotType
  element: JSX.Element
}

type CardSlots = Partial<Record<CardSlotType, JSX.Element>>

function createCardSlot(type: CardSlotType, element: JSX.Element): JSX.Element {
  return {
    [CARD_SLOT]: true,
    type,
    element,
  } as CardSlot as unknown as JSX.Element
}

function isCardSlot(value: unknown): value is CardSlot {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<CardSlot>)[CARD_SLOT] === true
  )
}

export function CardImpl(props: CardProps) {
  const [local, rest] = splitProps(props, [
    'borderRadius',
    'children',
    'class',
    'className',
    'padding',
  ])
  const resolvedChildren = resolveChildren(() => local.children)
  const slots = createMemo(() => {
    const next: CardSlots = {}

    for (const child of resolvedChildren.toArray()) {
      if (!isCardSlot(child)) continue
      next[child.type] = child.element
    }

    return next
  })
  const hasSlotChildren = () => Object.keys(slots()).length > 0

  return (
    <div
      {...rest}
      class={mergeClassNames(styles.Card, local.className, local.class)}
      data-padding={local.padding ?? 'normal'}
      data-border-radius={local.borderRadius ?? 'large'}
    >
      <Show when={hasSlotChildren()} fallback={resolvedChildren()}>
        <Show when={slots().image || slots().icon}>
          <div
            class={mergeClassNames(
              styles.CardHeader,
              slots().image ? styles.CardHeaderEdgeToEdge : undefined,
            )}
          >
            {slots().image || slots().icon}
          </div>
        </Show>
        <div class={styles.CardBody}>
          <div class={styles.CardContent}>
            {slots().heading}
            {slots().description}
          </div>
          <Show when={slots().metadata}>
            <div class={styles.CardMetadataContainer}>{slots().metadata}</div>
          </Show>
        </div>
        <Show when={slots().menu}>
          <div class={styles.CardMenu}>{slots().menu}</div>
        </Show>
      </Show>
    </div>
  )
}

export function CardIcon(props: CardIconProps) {
  const [local] = splitProps(props, ['aria-label', 'class', 'className', 'icon'])

  return createCardSlot(
    'icon',
    <span
      class={mergeClassNames(styles.CardIcon, local.className, local.class)}
      role={local['aria-label'] ? 'img' : undefined}
      aria-label={local['aria-label']}
      aria-hidden={!local['aria-label']}
    >
      <Dynamic component={local.icon} />
    </span>,
  )
}

export function CardImage(props: CardImageProps) {
  const [local, rest] = splitProps(props, [
    'alt',
    'class',
    'className',
    'src',
  ])

  return createCardSlot(
    'image',
    <img
      {...rest}
      src={local.src}
      alt={local.alt ?? ''}
      class={mergeClassNames(styles.CardImage, local.className, local.class)}
    />,
  )
}

export function CardHeading(props: CardHeadingProps) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return createCardSlot(
    'heading',
    <Component
      component={local.as ?? 'h3'}
      {...rest}
      class={mergeClassNames(styles.CardHeading, local.className, local.class)}
    >
      {local.children}
    </Component>,
  )
}

export function CardDescription(props: CardDescriptionProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
  ])

  return createCardSlot(
    'description',
    <p
      {...rest}
      class={mergeClassNames(
        styles.CardDescription,
        local.className,
        local.class,
      )}
    >
      {local.children}
    </p>,
  )
}

export function CardMenu(props: CardMenuProps) {
  const [local] = splitProps(props, ['children'])

  return createCardSlot('menu', <>{local.children}</>)
}

export function CardMetadata(props: CardMetadataProps) {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
  ])

  return createCardSlot(
    'metadata',
    <div
      {...rest}
      class={mergeClassNames(
        styles.CardMetadataItem,
        local.className,
        local.class,
      )}
    >
      {local.children}
    </div>,
  )
}

CardImpl.displayName = 'Card'
CardIcon.displayName = 'Card.Icon'
CardImage.displayName = 'Card.Image'
CardHeading.displayName = 'Card.Heading'
CardDescription.displayName = 'Card.Description'
CardMenu.displayName = 'Card.Menu'
CardMetadata.displayName = 'Card.Metadata'
