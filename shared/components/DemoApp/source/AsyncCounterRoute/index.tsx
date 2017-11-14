import { asyncComponent } from 'react-async-component'
declare var System

export default asyncComponent({
  resolve: () => System.import(/* webpackChunkName: "counter" */ './CounterRoute'),
})