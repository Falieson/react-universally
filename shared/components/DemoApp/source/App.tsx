
import * as React from 'react'
import Helmet from 'react-helmet'
import { Route, Switch } from 'react-router-dom'

import Error404 from './Error404'
import Header from './Header'

import AsyncAboutRoute from './AsyncAboutRoute'
import AsyncCounterRoute from './AsyncCounterRoute'
import AsyncHomeRoute from './AsyncHomeRoute'

class App extends React.Component<{}, {}> {

  public render() {

    return (
      <div style={{ padding: '2rem' }}>
        <Helmet>
          <meta name="title" content="App-Title" />
        </Helmet>
        <Header />
        <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <Switch>
            <Route exact path="/" component={AsyncHomeRoute} />
            <Route path="/counter" component={AsyncCounterRoute} />
            <Route path="/about" component={AsyncAboutRoute} />
            <Route component={Error404} />
          </Switch>
        </div>
      </div>
    )
  }
}

export default App