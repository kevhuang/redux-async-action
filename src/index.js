import { isString, isFunction, noop } from 'lodash';
import { isFSA } from 'flux-standard-action';
import Debug from 'debug';

const debugActionCreator = Debug('redux-async-action:asyncActionCreator');
const debugActionMiddleware = Debug('redux-async-action:asyncActionMiddleware');

/**
 * Dispatches a __START action before an async job starts and dispatches another action when the job settles.
 * If the job threw an exception, a __ERROR action would be dispatched. All actions dispatched are in FSA format.
 * @param  {Function} dispatch       The store's dispatch function
 * @param  {String}   type           Name of the action type. This will prefix the __START and __ERROR action types.
 * @param  {Function} payloadCreator Async job that is passed `dispatch` and returns the data to be used as the action payload
 * @param  {*}        [meta]         Any additional metadata to include with the final action
 * @param  {Function} [cb=noop]      Node.js style callback function that is called before the promise chain finishes
 * @return {Promise} Dispatches the appropriate action depending on the execution of `payloadCreator`
 */
export const asyncActionCreator = (dispatch, type, payloadCreator, meta, cb) => {
  debugActionCreator('start', {type, payloadCreator, meta, cb});
  if (!isFunction(dispatch)) {
    throw new TypeError('dispatch must be a function');
  }
  if (!isString(type)) {
    throw new TypeError('type must be a string');
  }
  if (!isFunction(payloadCreator)) {
    throw new TypeError('payloadCreator must be a function');
  }

  const finalCb = isFunction(cb) ? cb : noop;

  dispatch({type: `${type}__START`});

  return Promise.resolve()
    .then(() => payloadCreator(dispatch))
    .then(results => {
      debugActionCreator('payloadCreator results', results);
      dispatch({
        type,
        payload: results,
        meta
      });
      finalCb(null, results);
    })
    .catch(err => {
      dispatch({
        type: `${type}__ERROR`,
        payload: err,
        error: true,
        meta
      });
      finalCb(err, null);
    });
};

/**
 * @param  {Function} dispatch The store's dispatch function
 * @return {Function} Receives the next middleware's dispatch function and returns a function
 *                    for either calling `asyncActionCreator()` to dispatch the async actions
 *                    or for calling `next(action)`
 */
export const asyncActionMiddleware = ({ dispatch }) => next => actionCreator => {
  const action = isFunction(actionCreator) ? actionCreator() : actionCreator;
  if (isFSA(action) && isString(action.type) && isFunction(action.payload)) {
    debugActionMiddleware('dispatching async actions', action);
    return asyncActionCreator(dispatch, action.type, action.payload, action.meta);
  } else {
    debugActionMiddleware('incompatible action for middleware, no-op', action);
    return next(action);
  }
};

export default { asyncActionCreator, asyncActionMiddleware };
