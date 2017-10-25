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
    return {
      type: ServerMessageType.Subscribe,
      subscription: {
        id: uuid(),
        table: clientMessage.table,
        filter: clientMessage.filter ?
          clientMessage.filter.toString() :
          void 0
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
