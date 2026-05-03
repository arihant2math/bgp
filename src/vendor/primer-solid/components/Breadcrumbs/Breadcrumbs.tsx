import {
  Show,
  createContext,
  createMemo,
  createRenderEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'
import type { ComponentProps, JSX, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Details } from '../Details'
import { useOnEscapePress } from '../../hooks/useOnEscapePress'
import { useOnOutsideClick } from '../../hooks/useOnOutsideClick'
import { useResizeObserver } from '../../hooks/useResizeObserver'
import { mergeClassNames } from '../../utils'
import styles from './Breadcrumbs.module.css'

type DistributiveOmit<T, TOmitted extends PropertyKey> = T extends unknown
  ? Omit<T, TOmitted>
  : never

type Ref<T> = ((element: T) => void) | { current?: T | null } | undefined

type BreadcrumbsOverflow = 'wrap' | 'menu' | 'menu-with-root'
type BreadcrumbsVariant = 'normal' | 'spacious'

type BreadcrumbsOwnProps = {
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  overflow?: BreadcrumbsOverflow
  variant?: BreadcrumbsVariant
  ref?: Ref<HTMLElement>
}

export type BreadcrumbsProps = DistributiveOmit<
  ComponentProps<'nav'>,
  keyof BreadcrumbsOwnProps
> &
  BreadcrumbsOwnProps

type BreadcrumbsItemOwnProps<As extends ValidComponent> = {
  as?: As
  children?: JSX.Element
  class?: string
  /** React compatibility alias. Prefer `class` in Solid code. */
  className?: string
  ref?: Ref<unknown>
  selected?: boolean
  to?: unknown
}

export type BreadcrumbsItemProps<As extends ValidComponent = 'a'> =
  DistributiveOmit<ComponentProps<As>, keyof BreadcrumbsItemOwnProps<As>> &
    BreadcrumbsItemOwnProps<As>

type RegisteredBreadcrumbItem = {
  id: string
  props: BreadcrumbsItemProps<ValidComponent>
}

type BreadcrumbsContextValue = {
  upsert: (id: string, props: BreadcrumbsItemProps<ValidComponent>) => void
  remove: (id: string) => void
}

const BreadcrumbsContext = createContext<BreadcrumbsContextValue>()

function assignRef<T>(ref: Ref<T>, element: T) {
  if (typeof ref === 'function') {
    ref(element)
  } else if (ref) {
    ref.current = element
  }
}

function KebabHorizontalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11.5-1.5A1.5 1.5 0 1 1 16 7.5a1.5 1.5 0 0 1-3 0Z" />
    </svg>
  )
}

function ItemSeparator() {
  return (
    <span class={styles.ItemSeparator}>
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10.956 1.27994L6.06418 14.7201L5 14.7201L9.89181 1.27994L10.956 1.27994Z" fill="currentColor" />
      </svg>
    </span>
  )
}

function RenderedBreadcrumbItem(
  props: BreadcrumbsItemProps<ValidComponent> & {
    itemClass?: string
  },
) {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'className',
    'itemClass',
    'ref',
    'selected',
  ])
  const Component = Dynamic as unknown as (
    componentProps: Record<string, unknown>,
  ) => JSX.Element

  return (
    <Component
      component={local.as ?? 'a'}
      {...rest}
      ref={(element: unknown) => {
        assignRef(local.ref as Ref<unknown>, element)
      }}
      class={mergeClassNames(local.itemClass, local.className, local.class)}
      aria-current={local.selected ? 'page' : undefined}
    >
      {local.children}
    </Component>
  )
}

type BreadcrumbsMenuItemProps = {
  items: Array<RegisteredBreadcrumbItem>
  'aria-label'?: string
}

function BreadcrumbsMenuItem(props: BreadcrumbsMenuItemProps) {
  let detailsRef: HTMLDetailsElement | undefined
  let menuButtonRef: HTMLElement | undefined
  let menuContainerRef: HTMLDivElement | undefined
  const [isOpen, setIsOpen] = createSignal(false)

  const closeOverlay = () => {
    if (!detailsRef) return
    detailsRef.open = false
    setIsOpen(false)
  }

  useOnEscapePress((event) => {
    if (!isOpen()) return
    event.preventDefault()
    closeOverlay()
    menuButtonRef?.focus()
  })

  useOnOutsideClick({
    containerRef: () => menuContainerRef,
    ignoreClickRefs: [() => menuButtonRef, () => detailsRef],
    onClickOutside: () => {
      if (isOpen()) closeOverlay()
    },
  })

  const handleSummaryClick = (event: MouseEvent) => {
    event.preventDefault()
    if (!detailsRef) return

    const nextOpenState = !detailsRef.open
    detailsRef.open = nextOpenState
    setIsOpen(nextOpenState)
  }

  return (
    <Details
      ref={(element) => {
        detailsRef = element
      }}
      class={styles.MenuDetails}
      onToggle={(event) => {
        setIsOpen((event.currentTarget as HTMLDetailsElement).open)
      }}
    >
      <summary
        ref={(element) => {
          menuButtonRef = element
        }}
        role="button"
        aria-label={props['aria-label'] || `${props.items.length} more breadcrumb items`}
        aria-expanded={isOpen() ? 'true' : 'false'}
        class={styles.MenuSummary}
        onClick={handleSummaryClick}
      >
        <KebabHorizontalIcon />
      </summary>
      <Show when={isOpen()}>
        <div ref={menuContainerRef} class={styles.MenuOverlay}>
          <ul class={styles.MenuList}>
            {props.items.map((item) => (
              <li class={styles.MenuListItem}>
                <RenderedBreadcrumbItem {...item.props} itemClass={styles.MenuLink} />
              </li>
            ))}
          </ul>
        </div>
      </Show>
    </Details>
  )
}

function calculateOverflow(
  items: Array<RegisteredBreadcrumbItem>,
  overflow: BreadcrumbsOverflow,
  availableWidth: number,
) {
  if (overflow === 'wrap') {
    return {
      visibleItems: items,
      menuItems: [] as Array<RegisteredBreadcrumbItem>,
      effectiveHideRoot: false,
    }
  }

  const hideRoot = overflow === 'menu'
  let minimumVisibleItems = hideRoot ? 4 : 3

  if (hideRoot && availableWidth > 0 && availableWidth < 544 && items.length > 2) {
    minimumVisibleItems = 1
  }

  const visibleItems = [...items]
  const menuItems: Array<RegisteredBreadcrumbItem> = []

  while (visibleItems.length > minimumVisibleItems) {
    const item = visibleItems.shift()
    if (!item) break
    menuItems.push(item)
  }

  return {
    visibleItems,
    menuItems,
    effectiveHideRoot: hideRoot,
  }
}

function BreadcrumbsRoot(props: BreadcrumbsProps) {
  let containerRef: HTMLElement | undefined
  const [registeredItems, setRegisteredItems] = createSignal<Array<RegisteredBreadcrumbItem>>([])
  const [containerWidth, setContainerWidth] = createSignal(0)
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'overflow',
    'ref',
    'variant',
  ])

  const overflow = () => local.overflow ?? 'wrap'
  const variant = () => local.variant ?? 'normal'

  const contextValue: BreadcrumbsContextValue = {
    upsert: (id, itemProps) => {
      setRegisteredItems((current) => {
        const index = current.findIndex((item) => item.id === id)
        if (index === -1) return [...current, { id, props: itemProps }]

        const next = current.slice()
        next[index] = { id, props: itemProps }
        return next
      })
    },
    remove: (id) => {
      setRegisteredItems((current) => current.filter((item) => item.id !== id))
    },
  }

  useResizeObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    },
    () => containerRef,
  )

  const overflowState = createMemo(() =>
    calculateOverflow(registeredItems(), overflow(), containerWidth()),
  )

  const renderedListItems = createMemo(() => {
    const items = registeredItems()

    if (overflow() === 'wrap') {
      return items.map((item) => (
        <li class={styles.ItemWrapper}>
          <RenderedBreadcrumbItem {...item.props} itemClass={styles.Item} />
        </li>
      ))
    }

    const { visibleItems, menuItems, effectiveHideRoot } = overflowState()
    const menuContents = effectiveHideRoot ? menuItems : menuItems.slice(1)
    const rootItem = items[0]

    const visibleElements = visibleItems.map((item) => (
      <li class={styles.BreadcrumbsItem}>
        <RenderedBreadcrumbItem {...item.props} itemClass={styles.Item} />
        <ItemSeparator />
      </li>
    ))

    if (menuContents.length === 0) {
      if (!effectiveHideRoot && rootItem && !visibleItems.some((item) => item.id === rootItem.id)) {
        return [
          <li class={styles.BreadcrumbsItem}>
            <RenderedBreadcrumbItem {...rootItem.props} itemClass={styles.Item} />
            <ItemSeparator />
          </li>,
          ...visibleElements,
        ]
      }

      return visibleElements
    }

    const menuElement = (
      <li class={styles.BreadcrumbsItem}>
        <BreadcrumbsMenuItem
          items={menuContents}
          aria-label={`${menuContents.length} more breadcrumb items`}
        />
        <ItemSeparator />
      </li>
    )

    if (effectiveHideRoot || !rootItem) {
      return [menuElement, ...visibleElements]
    }

    return [
      <li class={styles.BreadcrumbsItem}>
        <RenderedBreadcrumbItem {...rootItem.props} itemClass={styles.Item} />
        <ItemSeparator />
      </li>,
      menuElement,
      ...visibleElements,
    ]
  })

  return (
    <BreadcrumbsContext.Provider value={contextValue}>
      <nav
        {...rest}
        ref={(element) => {
          containerRef = element
          assignRef(local.ref, element)
        }}
        class={mergeClassNames(local.className, local.class, styles.BreadcrumbsBase)}
        aria-label="Breadcrumbs"
        data-overflow={overflow()}
        data-variant={variant()}
      >
        <ol class={styles.BreadcrumbsList}>{renderedListItems()}</ol>
        <div hidden aria-hidden="true">
          {local.children}
        </div>
      </nav>
    </BreadcrumbsContext.Provider>
  )
}

function BreadcrumbsItem<As extends ValidComponent = 'a'>(
  props: BreadcrumbsItemProps<As>,
) {
  const context = useContext(BreadcrumbsContext)

  if (!context) {
    return <RenderedBreadcrumbItem {...(props as BreadcrumbsItemProps<ValidComponent>)} itemClass={styles.Item} />
  }

  const id = createUniqueId()

  createRenderEffect(() => {
    context.upsert(id, { ...(props as BreadcrumbsItemProps<ValidComponent>) })
  })

  onCleanup(() => {
    context.remove(id)
  })

  return null
}

BreadcrumbsRoot.displayName = 'Breadcrumbs'
BreadcrumbsItem.displayName = 'Breadcrumbs.Item'

export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbsItem,
})

/**
 * @deprecated Use the `Breadcrumbs` component instead.
 */
export const Breadcrumb = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbsItem,
})

/**
 * @deprecated Use `BreadcrumbsProps` instead.
 */
export type BreadcrumbProps = BreadcrumbsProps

/**
 * @deprecated Use `BreadcrumbsItemProps` instead.
 */
export type BreadcrumbItemProps<As extends ValidComponent = 'a'> =
  BreadcrumbsItemProps<As>

export default Breadcrumbs
