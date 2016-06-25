# redux-async-action

[![Build Status](https://travis-ci.org/kevhuang/redux-async-action.svg?branch=master)](https://travis-ci.org/kevhuang/redux-async-action)
[![npm version](https://img.shields.io/npm/v/redux-async-action.svg?maxAge=2592000)](https://www.npmjs.com/package/redux-async-action)

## Overview

Typically when you asynchronously dispatch actions in Flux or Redux, you'd want to know when the action creator kicked off the asynchronous job, when the job finished, the results of the job, and whether there was an error performing the job. Very commonly, you may see UIs or views that display different components based on the state of the job, e.g., a spinner animation is displayed after the job started and is waiting for the results, and when the results arrive, the spinner is removed and the results are displayed.

Certain events, or actions in this case, are needed to allow subscribers or listeners to know what to do based on the state of the app. As a result, this Redux middleware provides a way to dispatch all the necessary actions to update the state based on the progress of an asynchoronus job. The following action types are dispatched:

- `ACTION_TYPE__START`: Dispatched before the asynchronous job is called
- `ACTION_TYPE`: Dispatched with the results from the resolved job
- `ACTION_TYPE__ERROR`: Dispatched with the Error from the rejected job

## Installation

```
npm install --save redux-async-action
```

Then, use [applyMiddleware()](http://redux.js.org/docs/api/applyMiddleware.html):

```
import { createStore, applyMiddleware } from 'redux';
import { asyncActionMiddleware } from 'redux-async-action';
import rootReducer from './reducers';

const store = createStore(
  rootReducer,
  applyMiddleware(asyncActionMiddleware)
);
```

## Usage

See below for examples:

```
// dispatch an action with a function payload
// the function payload can return the value or a promise that resolves the value
store.dispatch({
  type: 'FETCH_USER',
  payload: id => fetchUser(id)
});

// or

// dispatch an action with a value payload
store.dispatch({
  type: 'FETCH_USER',
  payload: user
}
);

// or

// dispatch an action creator (a function that returns an action)
store.dispatch(() => {
  // assume a job was previously ran in this function to retrieve a user

  return {
    type: 'FETCH_USER',
    payload: user
  };
});
```

In all the above examples, a `FETCH_USER__START` action would first be dispatched, and then when the value is settled, a `FETCH_USER` action would be dispatched. In the case an exception is thrown, a `FETCH_USER__ERROR` action would be dispatched. There is no "SUCCESS" action. In this case, the `FETCH_USER` and `FETCH_USER__ERROR` actions serve as the success. Also, the original action dispatched to the middleware will not be passed down the remaining chain of middlewares, but the actions dispatched by the middleware would be sent through the entire chain of middlewares.

Any other action formats dispatched to the middleware will be ignored and passed to the next middleware in line, if any.

All actions dispatched to the middleware must be [FSA](https://github.com/acdlite/flux-standard-action) compliant. The actions dispatched from the middleware are also FSA compliant.

## Notes

If you're also using [redux-thunk](https://github.com/gaearon/redux-thunk), `asyncActionMiddleware` must be placed before `redux-thunk` in the middleware chain.
