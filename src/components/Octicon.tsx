import { splitProps } from "solid-js";
import type { Component, JSX } from "solid-js";
import octicons from "@primer/octicons";

export { octicons };
export type OcticonName = keyof typeof octicons;

type OcticonProps = Omit<
    JSX.SvgSVGAttributes<SVGSVGElement>,
    "height" | "width" | "viewBox" | "innerHTML" | "children"
> & {
    name: OcticonName;
    size?: number;
    width?: number;
    height?: number;
    label?: string;
    stroke?: string;
    fill?: string;
};

const DEFAULT_HEIGHT = 16;

function closestNaturalHeight(naturalHeights: string[], requestedHeight: number) {
    return naturalHeights
        .map((height) => Number.parseInt(height, 10))
        .reduce(
            (bestHeight, naturalHeight) =>
                naturalHeight <= requestedHeight ? naturalHeight : bestHeight,
            Number.parseInt(naturalHeights[0] ?? `${DEFAULT_HEIGHT}`, 10),
        );
}

const Octicon: Component<OcticonProps> = (props) => {
    const [local, svgProps] = splitProps(props, [
        "name",
        "size",
        "width",
        "height",
        "label",
        "class",
        "aria-label",
        "aria-hidden",
        "role",
        "stroke",
        "fill"
    ]);

    const icon = () => octicons[local.name];
    const requestedHeight = () => local.height ?? local.size ?? DEFAULT_HEIGHT;
    const naturalHeight = () =>
        closestNaturalHeight(Object.keys(icon().heights), requestedHeight());
    const naturalIcon = () => icon().heights[naturalHeight()];
    const width = () =>
        local.width ??
        (local.height || local.size
            ? (requestedHeight() * naturalIcon().width) / naturalHeight()
            : naturalIcon().width);
    const label = () => local.label ?? local["aria-label"];

    return (
        <svg
            {...svgProps}
            stroke={local.stroke ?? "currentColor"}
            fill={local.fill ?? "currentColor"}
            version="1.1"
            width={width()}
            height={requestedHeight()}
            viewBox={`0 0 ${naturalIcon().width} ${naturalHeight()}`}
            class={`octicon octicon-${String(local.name)}${local.class ? ` ${local.class}` : ""}`}
            aria-label={label()}
            aria-hidden={label() ? undefined : (local["aria-hidden"] ?? "true")}
            role={label() ? (local.role ?? "img") : local.role}
            data-component="Octicon"
            innerHTML={naturalIcon().path}
        />
    );
};

export default Octicon;
