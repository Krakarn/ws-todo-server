import * as WebSocket from 'ws';

import { stringToClientMessage } from './client-message';
import { getClientMessageHandler } from './client-message-handlers';
import {
  IServerErrorMessage,
  ServerMessageType,
} from './server-message';
import { SocketEvent } from './socket-event';

const sendError = (socket: WebSocket, error: string) =>
  socket.send(JSON.stringify({error}))
;
const handleError = (socket: WebSocket, error: string) => {
  sendError(socket, error);
  console.error('Client error:', error);
};

const socketEventHandlers: {[event:string]: (
  socket: WebSocket,
  payload?: WebSocket.Data,
) => void;} = {
  [SocketEvent.Open]: () => console.log('Client connected.'),

  [SocketEvent.Message]: (socket, message) => {
    try {
      const clientMessage = stringToClientMessage(message.toString());

      console.log('Client message received:', clientMessage);

      const clientMessageHandler = getClientMessageHandler(clientMessage.type);

      if (!clientMessageHandler) {
        throw new Error(`Unhandled client message type ${clientMessage.type}`);
      }

      const response = clientMessageHandler(clientMessage);

      socket.send(JSON.stringify(response));

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
  },

  [SocketEvent.Close]: () => console.log('Client disconnected.'),

  [SocketEvent.Error]: handleError,
};

export const getSocketEventHandler = (name: string) => socketEventHandlers[name];
