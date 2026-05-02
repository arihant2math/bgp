import { Navigate, Route, Router } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'
import type { Component, JSX } from 'solid-js'
import Issues from './pages/Issues'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Pulls from './pages/Pulls'
import Repository from './pages/Repository'

const EmptyPage = () => (
  <main class="min-h-screen overflow-hidden bg-[#f3efe4] text-[#191510]"></main>
)

const requireAuth = (
  renderPage: (props: RouteSectionProps) => JSX.Element,
): Component<RouteSectionProps> => {
  return function ProtectedRoute(props) {
    if (!localStorage.getItem('gh_api_key')) {
      return <Navigate href="/login" />
    }

    return renderPage(props)
  }
}

function App() {
  return (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/notifications" component={requireAuth(() => <Notifications />)} />
      <Route
        path="/:profile"
        component={requireAuth((props) => <Profile profile={props.params.profile ?? ''} />)}
      />
      <Route
        path="/:profile/:repo"
        component={requireAuth((props) => (
          <Repository profile={props.params.profile ?? ''} repo={props.params.repo ?? ''} />
        ))}
      />
      <Route
        path="/:profile/:repo/issues"
        component={requireAuth((props) => (
          <Issues profile={props.params.profile ?? ''} repo={props.params.repo ?? ''} />
        ))}
      />
      <Route
        path="/:profile/:repo/pulls"
        component={requireAuth((props) => (
          <Pulls profile={props.params.profile ?? ''} repo={props.params.repo ?? ''} />
        ))}
      />
      <Route path="*" component={requireAuth(() => <EmptyPage />)} />
    </Router>
  )
}

export default App
