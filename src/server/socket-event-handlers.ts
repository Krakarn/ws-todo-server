import * as WebSocket from 'ws';

import { stringToExpression } from '../lang-filter/string-to-expression';
import { IEvaluationState } from '../lang/evaluation-state';
import { IClient } from './client';
import { stringToClientMessage } from './client-message';
import { getClientMessageHandler } from './client-message-handlers';
import {
  IServerErrorMessage,
  ServerMessageType,
} from './server-message';
import { SocketEvent } from './socket-event';
import { ITables, State } from './state';

const sendError = (client: IClient, error: string) =>
  client.socket.send(JSON.stringify({error}))
;
const handleError = <T extends ITables, U extends IEvaluationState>(
  state: State<T, U>,
  client: IClient,
  error: string
) => {
  sendError(client, error);
  console.error('Client error:', error);
};

const _try = <T>(socket: WebSocket, f: (...args: any[]) => T): T => {
  try {
    return f();
  } catch (e) {
    const errorBegin = 'Error parsing client message: ';
    const error = `${errorBegin} ${e.message}`;

    console.error(errorBegin, e);

    const response: IServerErrorMessage = {
      type: ServerMessageType.Error,
      error
    };

    socket.send(JSON.stringify(response));
  }
};

const socketEventHandlers: {[event:string]: <T extends ITables, U extends IEvaluationState>(
  state: State<T, U>,
  client: IClient,
  payload?: WebSocket.Data,
) => void;} = {
  [SocketEvent.Open]: (state, client) => {
    console.log(`Client ${client.id} connected.`);

    state.registerClient(client);
  },

  [SocketEvent.Message]: (state, client, message) => {
    _try(client.socket, () => {
      const clientMessage = stringToClientMessage(
        message.toString(),
        stringToExpression,
      );

      console.log(`Client ${client.id} message received:`, clientMessage);

      const clientMessageHandler = getClientMessageHandler(clientMessage.type);

      if (!clientMessageHandler) {
        throw new Error(`Unhandled client message type ${clientMessage.type}`);
      }

      setTimeout(() => {
        _try(client.socket, () => {
          const response = clientMessageHandler(state, client, clientMessage);

          client.socket.send(JSON.stringify(response));
        });
      }, 0);
    });
  },

  [SocketEvent.Close]: (state, client) => {
    console.log(`Client ${client.id} disconnected.`);

    state.deregisterClient(client.id);
  },

  [SocketEvent.Error]: handleError,
};

export const getSocketEventHandler = (name: string) => socketEventHandlers[name];
