/* eslint-env mocha */
import expect from 'expect'
import sinon from 'sinon'
import thunk from 'redux-thunk'

import mockMiddleware from './mock/middleware'
import configureStore from '../src'

const mockStore = configureStore([thunk])

describe('redux-mock-store', () => {
  it('calls getState if it is a function', () => {
    const getState = sinon.spy()
    const store = mockStore(getState, [])

    store.getState()
    expect(getState.called).toBe(true)
  })

  it('returns the initial state', () => {
    const initialState = { items: [], count: 0 }
    const store = mockStore(initialState)

    expect(store.getState()).toEqual(initialState)
  })

  it('should throw an error when action is undefined', () => {
    const store = mockStore({})

    expect(() => { store.dispatch(undefined) }).toThrow(
      'Actions may not be an undefined.'
    )
  })

  it('should throw an error when action type is undefined', () => {
    const action = { types: 'ADD_ITEM' }
    const store = mockStore({})

    expect(() => { store.dispatch(action) }).toThrow(
      'Actions may not have an undefined "type" property. ' +
      'Have you misspelled a constant? ' +
      'Action: ' +
      '{"types":"ADD_ITEM"}'
    )
  })

  it('should return if the tests is successful', () => {
    const action = { type: 'ADD_ITEM' }
    const store = mockStore({})

    store.dispatch(action)

    const [first] = store.getActions()
    expect(first).toBe(action)
  })

  it('handles async actions', (done) => {
    function increment () {
      return {
        type: 'INCREMENT_COUNTER'
      }
    }

    function incrementAsync () {
      return dispatch => {
        return Promise.resolve()
          .then(() => dispatch(increment()))
      }
    }

    const store = mockStore({})

    store.dispatch(incrementAsync())
      .then(() => {
        expect(store.getActions()[0]).toEqual(increment())
        done()
      })
  })

  it('should call the middleware', () => {
    const spy = sinon.spy()
    const middlewares = [mockMiddleware(spy)]
    const mockStoreWithMiddleware = configureStore(middlewares)
    const action = { type: 'ADD_ITEM' }

    const store = mockStoreWithMiddleware()
    store.dispatch(action)
    expect(spy.called).toBe(true)
  })

  it('should handle when test function throws an error', (done) => {
    const store = mockStore({})
    const error = { error: 'Something went wrong' }

    store.dispatch(() => Promise.reject(error))
      .catch(err => {
        expect(err).toEqual(error)
        done()
      })
  })

  it('clears the actions', () => {
    const action = { type: 'ADD_ITEM' }
    const store = mockStore({})

    store.dispatch(action)
    expect(store.getActions()).toEqual([action])

    store.clearActions()
    expect(store.getActions()).toEqual([])
  })

  it('handles multiple actions', () => {
    const store = mockStore()
    const actions = [
      { type: 'ADD_ITEM' },
      { type: 'REMOVE_ITEM' }
    ]

    store.dispatch(actions[0])
    store.dispatch(actions[1])

    expect(store.getActions()).toEqual(actions)
  })

  it('subscribes to dispatched actions', (done) => {
    const store = mockStore()
    const action = { type: 'ADD_ITEM' }

    store.subscribe(() => {
      expect(store.getActions()[0]).toEqual(action)
      done()
    })
    store.dispatch(action)
  })

  it('can unsubscribe subscribers', function (done) {
    const store = mockStore()
    const action = { type: 'ADD_ITEM' }
    const waitForMS = 25
    const testWaitsAnotherMS = 25

    this.timeout(waitForMS + testWaitsAnotherMS)
    const timeoutId = setTimeout(done, waitForMS)

    const unsubscribe = store.subscribe(() => {
      clearTimeout(timeoutId)
      done(new Error('should never be called'))
    })

    unsubscribe()
    store.dispatch(action)
  })

  it('has replace reducer function', () => {
    const store = mockStore({})

    expect(() => store.replaceReducer(() => {}))
      .toNotThrow('Expected the nextReducer to be a function.')

    expect(() => store.replaceReducer(123))
      .toThrow('Expected the nextReducer to be a function.')
  })
})
