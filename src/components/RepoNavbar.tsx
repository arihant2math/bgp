import type { Component, JSX } from "solid-js";

export type RepoTab = "code" | "issues" | "pulls";

type RepoNavbarItemProps = {
  href: string;
  label: string;
  active?: boolean;
  children: JSX.Element;
};

export const RepoNavbarItem: Component<RepoNavbarItemProps> = (props) => {
  return (
    <a
      href={props.href}
      aria-current={props.active ? "page" : undefined}
      class={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        props.active
          ? "border-[#fd8c73] text-[#191510]"
          : "border-transparent text-[#5c554b] hover:border-[#d8d0c2] hover:text-[#191510]"
      }`}
    >
      <span class="h-4 w-4" aria-hidden="true">
        {props.children}
      </span>
      {props.label}
    </a>
  );
};

type RepoNavbarProps = {
  profile: string;
  repo: string;
  active: RepoTab;
};

const iconClass = "h-4 w-4 stroke-current";

function repoHref(profile: string, repo: string, suffix = "") {
  const base = `/${encodeURIComponent(profile)}/${encodeURIComponent(repo)}`;
  return `${base}${suffix}`;
}

const RepoNavbar: Component<RepoNavbarProps> = (props) => {
  return (
    <nav>
      <div class="mx-auto flex max-w-6xl items-end px-4 sm:px-6 lg:px-8">
        <RepoNavbarItem
          href={repoHref(props.profile, props.repo)}
          label="Code"
          active={props.active === "code"}
        ></RepoNavbarItem>
        <RepoNavbarItem
          href={repoHref(props.profile, props.repo, "/issues")}
          label="Issues"
          active={props.active === "issues"}
        ></RepoNavbarItem>
        <RepoNavbarItem
          href={repoHref(props.profile, props.repo, "/pulls")}
          label="Pull requests"
          active={props.active === "pulls"}
        ></RepoNavbarItem>
      </div>
    </nav>
  );
};

export default RepoNavbar;
