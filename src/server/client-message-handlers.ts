import * as uuid from 'uuid/v4';

import { IClient } from './client';
import { ITables, State } from './state';

import { getParserHistory } from '../lang-standard/history';
import { IEvaluationState } from '../lang/evaluation-state';
import { parserHistoryToString } from '../lang/parser';
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
    let value: any;

    try {
      const expressionString = clientMessage.expression.toString();
      const parserHistory = getParserHistory(expressionString);

      const parserHistoryString = parserHistoryToString(parserHistory);

      console.log(
        `Client ${client.id} debug ${clientMessage.expression.toString()}`,
        parserHistoryString,
      );

      (clientMessage.expression as any).evaluateType(
        state.typeEvaluationState
      );

      value =
        clientMessage.expression.evaluate(state.evaluationState)
      ;

      return {
        type: ServerMessageType.Debug,
        message: value,
      } as IServerDebugMessage;

    } catch(e) {
      const result: any = {
        message: e.message,
      };

      if (e.state) {
        result.state = e.state;
      }

      throw new Error(JSON.stringify(result));
    }
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
