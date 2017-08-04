import Debug from 'debug';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import { isFSA } from 'flux-standard-action';
import asyncActionCreator from './asyncActionCreator';

const debug = Debug('redux-async-action:asyncActionMiddleware');

/**
 * @param  {Function} dispatch The store's dispatch function
 * @return {Function} Receives the next middleware's dispatch function and returns a function
 *                    for either calling `asyncActionCreator()` to dispatch the async actions
 *                    or for calling `next(action)`
 */
export default ({ dispatch }) => next => actionCreator => {
  const action = isFunction(actionCreator) ? actionCreator() : actionCreator;
  if (isFSA(action) && isString(action.type) && isFunction(action.payload)) {
    debug('dispatching async actions', action);
    return asyncActionCreator(dispatch, action.type, action.payload, action.meta);
  } else {
    debug('incompatible action for middleware, no-op', action);
    return next(action);
  }
};