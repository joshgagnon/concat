import { createStore, applyMiddleware } from 'redux'
import * as thunk from 'redux-thunk'
import rootReducer from './reducer.ts'


export default function configureStore(initialState) {
  return createStore(
    rootReducer,
    initialState,
    applyMiddleware(
      <any>thunk
    )
  )
}