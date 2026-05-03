import { Navigate, Route, Router, useParams } from "@solidjs/router";
import type { RouteSectionProps } from "@solidjs/router";
import type { Component, JSX } from "solid-js";
import Home from "./pages/Home";
import Issues from "./pages/repo/Issues.tsx";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Pulls from "./pages/repo/Pulls.tsx";
import Repository from "./pages/repo/Repository.tsx";
import Commits from "./pages/repo/Commits.tsx";
import MainNavbar from "./components/MainNavbar.tsx";
import { appBasePath } from "./lib/baseUrl.ts";

const EmptyPage = () => <main></main>;

const AppLayout: Component<RouteSectionProps> = (props) => (
    <div>
        <MainNavbar />
        {props.children}
    </div>
);

const requireAuth = (
    renderPage: (props: RouteSectionProps) => JSX.Element,
): Component<RouteSectionProps> => {
    return function ProtectedRoute(props) {
        if (!localStorage.getItem("gh_api_key")) {
            return <Navigate href="/login" />;
        }

        return renderPage(props);
    };
};

function RepoCodeRoute() {
    const params = useParams();
    const restParam = () => params.rest;
    const rest = () =>
        Array.isArray(restParam()) ? restParam().join("/") : (restParam() ?? "");

    if (rest() === "") {
        return (
            <Repository
                profile={params.profile ?? ""}
                repo={params.repo ?? ""}
                tree={null}
                path={[]}
            />
        );
    }

    const segments = () => rest().split("/").filter(Boolean);
    if (segments()[0] !== "tree" || !segments()[1]) {
        return <EmptyPage />;
    }

    return (
        <Repository
            profile={params.profile ?? ""}
            repo={params.repo ?? ""}
            tree={segments()[1]}
            path={segments().slice(2)}
        />
    );
}

function App() {
    return (
        <Router base={appBasePath || undefined} root={AppLayout}>
            <Route
                path="/"
                component={requireAuth(() => (
                    <Home />
                ))}
            />
            <Route path="/login" component={Login} />
            <Route
                path="/notifications"
                component={requireAuth(() => (
                    <Notifications />
                ))}
            />
            <Route
                path="/:profile"
                component={requireAuth((props) => (
                    <Profile profile={props.params.profile ?? ""} />
                ))}
            />
            <Route
                path="/:profile/:repo/commits/:tree"
                component={requireAuth((props) => (
                    <Commits
                        profile={props.params.profile ?? ""}
                        repo={props.params.repo ?? ""}
                        tree={props.params.tree ?? ""}
                        path={[]}
                    />
                ))}
            />
            <Route
                path="/:profile/:repo/commits/:tree/*path"
                component={requireAuth((props) => (
                    <Commits
                        profile={props.params.profile ?? ""}
                        repo={props.params.repo ?? ""}
                        tree={props.params.tree ?? ""}
                        path={
                            Array.isArray(props.params.path)
                                ? props.params.path
                                : props.params.path
                                  ? [props.params.path]
                                  : []
                        }
                    />
                ))}
            />
            <Route
                path="/:profile/:repo/issues"
                component={requireAuth((props) => (
                    <Issues
                        profile={props.params.profile ?? ""}
                        repo={props.params.repo ?? ""}
                    />
                ))}
            />
            <Route
                path="/:profile/:repo/pulls"
                component={requireAuth((props) => (
                    <Pulls
                        profile={props.params.profile ?? ""}
                        repo={props.params.repo ?? ""}
                    />
                ))}
            />
            <Route
                path="/:profile/:repo/*rest"
                component={requireAuth(() => <RepoCodeRoute />)}
            />
            <Route
                path="*"
                component={requireAuth(() => (
                    <EmptyPage />
                ))}
            />
        </Router>
    );
}

export default App;
