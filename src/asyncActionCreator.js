import Debug from 'debug';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import noop from 'lodash/noop';

const debug = Debug('redux-async-action:asyncActionCreator');

/**
 * Dispatches a __START action before an async job starts and dispatches another action when
 * the job settles. If the job threw an exception, a __ERROR action would be dispatched.
 * All actions dispatched are in FSA format.
 * @param  {Function} dispatch       The store's dispatch function
 * @param  {String}   type           Name of the action type. This will prefix the __START and
 *                                   __ERROR action types
 * @param  {Function} payloadCreator Async job that is passed `dispatch` and returns the data to
 *                                   be used as the action payload
 * @param  {*}        [meta]         Any additional metadata to include with the final action
 * @param  {Function} [cb=noop]      Node.js style callback function that is called before the
 *                                   promise chain finishes
 * @return {Promise} Dispatches the appropriate action depending on the execution of
 *                   `payloadCreator`
 */
export default (dispatch, type, payloadCreator, meta, cb) => {
  debug('start', { type, payloadCreator, meta, cb });
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

  dispatch({ type: `${type}__START` });

  return Promise.resolve()
    .then(() => payloadCreator(dispatch))
    .then((results) => {
      debug('payloadCreator results', results);
      dispatch({
        type,
        payload: results,
        meta,
      });
      finalCb(null, results);
    })
    .catch((err) => {
      dispatch({
        type: `${type}__ERROR`,
        payload: err,
        error: true,
        meta,
      });
      finalCb(err, null);
    });
};
