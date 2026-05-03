import type { Component } from "solid-js";

type AvatarSize = number | string;

export type AvatarProps = {
    /** Image URL for the avatar. */
    href: string;
    /** Width and height. Numbers are treated as pixels. */
    size: AvatarSize;
    alt?: string;
    class?: string;
};

function avatarSize(size: AvatarSize) {
    return typeof size === "number" ? `${size}px` : size;
}

const Avatar: Component<AvatarProps> = (props) => {
    const resolvedSize = () => avatarSize(props.size);

    return (
        <img
            src={props.href}
            alt={props.alt ?? ""}
            width={resolvedSize()}
            height={resolvedSize()}
            draggable={false}
            class={`rounded-full object-cover select-none shrink-0 ${props.class ?? ""}`.trim()}
            style={{
                width: resolvedSize(),
                height: resolvedSize(),
            }}
        />
    );
};

export default Avatar;
