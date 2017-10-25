import * as uuid from 'uuid/v4';

import {
  ClientMessageType,
  IClientMessage,
  IClientSubscribeMessage,
  IClientUnsubscribeMessage,
} from './client-message';

import {
  IServerMessage,
  IServerSubscribeResponse,
  IServerUnsubscribeResponse,
  ServerMessageType,
} from './server-message';

const clientMessageHandlers: {[type:string]: (clientMessage: IClientMessage) => IServerMessage} = {
  [ClientMessageType.Subscribe]: (clientMessage: IClientSubscribeMessage<any>) => {
    const state: any = {};

    const cloneState = state => {
      const newState = {...state};
      newState.clone = cloneState.bind(this, newState);

      return newState;
    };

    state.clone = cloneState.bind(this, state);

    return {
      type: ServerMessageType.Subscribe,
      subscription: {
        id: uuid(),
        table: clientMessage.table,
        filter: clientMessage.filter ?
          clientMessage.filter.toString() :
          void 0,
        filterEvaluated: clientMessage.filter ?
          clientMessage.filter.evaluate(state) :
          void 0,
      }
    } as IServerSubscribeResponse;
  },

  [ClientMessageType.Unsubscribe]: (clientMessage: IClientUnsubscribeMessage) => {
    return {
      type: ServerMessageType.Unsubscribe,
      subscription: {
        id: clientMessage.subscriptionId,
      }
    } as IServerUnsubscribeResponse;
  },
};

export const getClientMessageHandler = type => clientMessageHandlers[type];
