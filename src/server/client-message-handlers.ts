import * as uuid from 'uuid/v4';

import { IClient } from './client';
import { ITables, State } from './state';

import { IEvaluationState } from '../lang/evaluation-state';
import { serializeSubscription } from './subscription';

import {
  IClientCreateMessage,
  IClientDebugMessage,
  IClientDeleteMessage,
  IClientMessage,
  IClientSubscribeMessage,
  IClientUnsubscribeMessage,
  IClientUpdateMessage,
} from './client-message';
import { ClientMessageType } from './client-message-type';

import {
  IServerDebugMessage,
  IServerMessage,
  IServerSubscribeResponse,
  IServerUnsubscribeResponse,
  ServerMessageType,
} from './server-message';

const clientMessageHandlers: {[type:string]:
  <T extends ITables, U extends IEvaluationState>(
    state: State<T, U>,
    client: IClient,
    clientMessage: IClientMessage,
  ) => IServerMessage | void;
} = {
  [ClientMessageType.Debug]: <T extends ITables, U extends IEvaluationState>(
    state,
    client: IClient,
    clientMessage: IClientDebugMessage<U, any>
  ) => {
    const value = clientMessage.expression.evaluate(state.evaluationState);

    console.log(`Client ${client.id} debug ${clientMessage.expression.toString()}`, value);

    return {
      type: ServerMessageType.Debug,
      message: value,
    } as IServerDebugMessage;
  },

  [ClientMessageType.Subscribe]: (
    state,
    client: IClient,
    clientMessage: IClientSubscribeMessage<any>
  ) => {
    const subscription = state.subscribe(
      client.id,
      clientMessage.table,
      clientMessage.filter,
    );

    const serializedSubscription = serializeSubscription(subscription);

    console.log(`Client ${client.id} subscribed`, serializedSubscription);

    return {
      type: ServerMessageType.Subscribe,
      subscription: serializedSubscription,
    } as IServerSubscribeResponse;
  },

  [ClientMessageType.Unsubscribe]: (
    state,
    client,
    clientMessage: IClientUnsubscribeMessage
  ) => {
    const subscription = state.unsubscribe(
      client.id,
      clientMessage.subscriptionId,
    );

    const serializedSubscription = serializeSubscription(subscription);

    console.log(`Client ${client.id} unsubscribed`, serializedSubscription);

    return {
      type: ServerMessageType.Unsubscribe,
      subscription: serializedSubscription,
    } as IServerUnsubscribeResponse;
  },

  [ClientMessageType.Create]: (
    state,
    client,
    clientMessage: IClientCreateMessage<any>,
  ) => {
    state.tables[clientMessage.table].create(clientMessage.item);
  },

  [ClientMessageType.Delete]: (
    state,
    client,
    clientMessage: IClientDeleteMessage,
  ) => {
    state.tables[clientMessage.table].delete(clientMessage.id);
  },

  [ClientMessageType.Update]: (
    state,
    client,
    clientMessage: IClientUpdateMessage<any>,
  ) => {
    state.tables[clientMessage.table].update(clientMessage.item);
  },
};

export const getClientMessageHandler = type => clientMessageHandlers[type];
