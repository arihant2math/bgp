import { RelativeTime } from "@primer/solid";
import { Show } from "solid-js";

export type RelativeDateProps = {
    datetime: string;
    class?: string;
    fallback?: string;
};

function isValidDate(value: string) {
    return !Number.isNaN(new Date(value).getTime());
}

function RelativeDate(props: RelativeDateProps) {
    return (
        <Show
            when={isValidDate(props.datetime)}
            fallback={
                <span class={props.class}>
                    {props.fallback ?? "unknown date"}
                </span>
            }
        >
            <RelativeTime
                datetime={props.datetime}
                format="relative"
                class={props.class}
            />
        </Show>
    );
}

export default RelativeDate;
