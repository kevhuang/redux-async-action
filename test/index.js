import chai from 'chai';
import sinon from 'sinon';
import { isFSA } from 'flux-standard-action';
import { asyncActionCreator, asyncActionMiddleware } from '../src';

let dispatchedPayloads = [];

const expect = chai.expect,
  dispatch = payload => {
    dispatchedPayloads.push(payload);
  },
  actionType = 'GET_SOME',
  payload = {message: 'Got some'},
  successfulPayloadCreator = () => new Promise(resolve => {
    setTimeout(resolve.bind(this, payload), 100);
  }),
  errorMessage = 'Oops',
  errorPayloadCreator = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, 100);
  });

beforeEach((done) => {
  dispatchedPayloads = [];
  done();
});

describe('asyncActionCreator', () => {
  const callActionCreatorWith = (...args) => () => asyncActionCreator(...args);

  it('is a function', () => {
    expect(asyncActionCreator).to.be.a('function');
  });

  it('throws if a dispatch function is not passed in', () => {
    const throwMessage = 'dispatch must be a function';
    expect(callActionCreatorWith()).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith({})).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(1)).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith('function')).to.throw(TypeError, throwMessage);
  });

  it('throws if type is not a string', () => {
    const throwMessage = 'type must be a string';
    expect(callActionCreatorWith(dispatch)).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, {})).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, 1)).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, Symbol(actionType))).to.throw(TypeError, throwMessage);
  });

  it('throws if a payloadCreator function is not passed in', () => {
    const throwMessage = 'payloadCreator must be a function';
    expect(callActionCreatorWith(dispatch, actionType)).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, actionType, {})).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, actionType, 1)).to.throw(TypeError, throwMessage);
    expect(callActionCreatorWith(dispatch, actionType, 'function')).to.throw(TypeError, throwMessage);
  });

  it('dispatches a __START action', () => {
    return asyncActionCreator(dispatch, actionType, successfulPayloadCreator)
      .then(() => {
        expect(dispatchedPayloads[0].type).to.equal('GET_SOME__START');
      });
  });

  it('dispatches the main action in FSA format for a successful payload creator', () => {
    return asyncActionCreator(dispatch, actionType, successfulPayloadCreator)
      .then(() => {
        expect(dispatchedPayloads).to.have.lengthOf(2);
        const mainAction = dispatchedPayloads[1];
        expect(isFSA(mainAction)).to.be.true;
        expect(mainAction.type).to.equal(actionType);
        expect(mainAction.payload).to.deep.equal(payload);
      })
  });

  it('dispatches the main action in FSA format with metadata', () => {
    const meta = {me: 'awesome'};
    return asyncActionCreator(dispatch, actionType, successfulPayloadCreator, meta)
      .then(() => {
        const mainAction = dispatchedPayloads[1];
        expect(isFSA(mainAction)).to.be.true;
        expect(mainAction.meta).to.deep.equal(meta);
      });
  });

  it('calls the provided callback with the successful payload result', () => {
    return asyncActionCreator(dispatch, actionType, successfulPayloadCreator, null, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.deep.equal(payload);
    });
  });

  it('calls the provided callback when the payload creator throws', () => {
    return asyncActionCreator(dispatch, actionType, errorPayloadCreator, null, (err, result) => {
      expect(result).to.be.null;
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.be.equal(errorMessage);
    });
  });

  it('dispatches a __ERROR action in FSA format when the payload creator throws', () => {
    return asyncActionCreator(dispatch, actionType, errorPayloadCreator)
      .then(() => {
        expect(dispatchedPayloads).to.have.lengthOf(2);
        const errorAction = dispatchedPayloads[1];
        expect(isFSA(errorAction)).to.be.true;
        expect(errorAction.type).to.equal('GET_SOME__ERROR');
        expect(errorAction.error).to.be.true;
        expect(errorAction.payload).to.be.an.instanceOf(Error);
        expect(errorAction.payload.message).to.be.equal(errorMessage);
      });
  });
});

describe('asyncActionMiddleware', () => {
  let nextMiddlewareSpy = sinon.spy();
  const createFakeStore = () => ({
      getState() {
        // empty state
        return {};
      },
      dispatch
    }),
    dispatchWithAction = action => {
      const dispatch = asyncActionMiddleware(createFakeStore())(nextMiddlewareSpy);
      return dispatch(action);
    },
    fsaAction = {
      type: actionType,
      payload: successfulPayloadCreator
    },
    actionCreator = () => fsaAction;

  beforeEach(() => {
    nextMiddlewareSpy.reset();
  });

  it('is a function', () => {
    expect(asyncActionMiddleware).to.be.a('function');
  });

  it('kicks off a new dispatch cycle if the action is a function that returns a FSA action with a function payload', () => {
    return dispatchWithAction(actionCreator)
      .then(() => {
        expect(nextMiddlewareSpy.called).to.be.false;
      });
  });

  it('dispatches the action to the next middleware if the action payload is not a function', () => {
    dispatchWithAction({type: actionType, payload: actionType})
    expect(nextMiddlewareSpy.called).to.be.true;
  });

  it('dispatches the action to the next middleware if the action is not a FSA action', () => {
    dispatchWithAction({type: actionType, data: payload})
    expect(nextMiddlewareSpy.called).to.be.true;
  });
});
