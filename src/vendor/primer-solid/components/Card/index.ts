import {
  CardDescription,
  CardHeading,
  CardIcon,
  CardImage,
  CardImpl,
  CardMenu,
  CardMetadata,
} from './Card'
import type {
  CardDescriptionProps,
  CardHeadingProps,
  CardIconProps,
  CardImageProps,
  CardMenuProps,
  CardMetadataProps,
  CardProps,
} from './Card'

const Card = Object.assign(CardImpl, {
  Icon: CardIcon,
  Image: CardImage,
  Heading: CardHeading,
  Description: CardDescription,
  Menu: CardMenu,
  Metadata: CardMetadata,
})

export { Card }
export type {
  CardDescriptionProps,
  CardHeadingProps,
  CardIconProps,
  CardImageProps,
  CardMenuProps,
  CardMetadataProps,
  CardProps,
}
