import * as http from 'http';
import * as Rx from 'rxjs';
import * as WebSocket from 'ws';

import { ITables, State } from './state';

import {
  IServerErrorMessage,
  IServerMessage,
  IServerSubscribeResponse,
  IServerUnsubscribeResponse,
  ServerMessageType,
} from './server-message';

import {
  ClientMessageType,
  IClientMessage,
  IClientSubscribeMessage,
  IClientUnsubscribeMessage,
  stringToClientMessage,
} from './client-message';

const options = {
  port: 8090,
};

export interface ISocketConnected {
  socket: WebSocket;
  request: http.IncomingMessage;
}

export interface ISocketEvent<T> {
  name: string;
  payload?: T;
}

export enum SocketEvent {
  Message = 'message',
  Open = 'open',
  Close = 'close',
  Error = 'error',
}

const ws$subject = new Rx.Subject<ISocketConnected>();
const ws$ = ws$subject.asObservable()
  .map(({socket, request}) => {
    const socket$subject = new Rx.Subject<ISocketEvent<WebSocket.Data>>();
    const socket$ = socket$subject.asObservable()
      .startWith({name: SocketEvent.Open})
    ;

    socket.on('close', () => socket$subject.complete());
    socket.on('error', error => socket$subject.error(error));
    socket.on('message', message => socket$subject.next({
      name: SocketEvent.Message,
      payload: message,
    }));

    return {socket, socket$};
  })
;

const sendError = (socket: WebSocket, error: string) => socket.send(JSON.stringify({error}));
const handleError = (socket: WebSocket, error: string) => {
  sendError(socket, error);
  console.error('Client error:', error);
};

const clientMessageHandlers: {[type:string]: (clientMessage: IClientMessage) => IServerMessage} = {
  [ClientMessageType.Subscribe]: (clientMessage: IClientSubscribeMessage<any>) => {
    return {
      type: ServerMessageType.Subscribe,
      subscription: {
        id: 0,
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

const socketEventHandlers: {[event:string]: (socket: WebSocket, payload?: WebSocket.Data) => void} = {
  [SocketEvent.Open]: () => console.log('Client connected.'),

  [SocketEvent.Message]: (socket, message) => {
    try {
      const clientMessage = stringToClientMessage(message.toString());

      console.log('Client message received:', clientMessage);

      const clientMessageHandler = clientMessageHandlers[clientMessage.type];

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

const getSocketEventHandler = (name: string) => socketEventHandlers[name];

export const start = <T extends ITables>(state: State<T>) => {
  ws$.subscribe(({socket, socket$}) => {
    const socket$subscription = socket$.subscribe(
      ({name, payload}) => {
        const handler = getSocketEventHandler(name);

        if (handler) {
          handler(socket, payload);
        } else {
          const errorHandler = getSocketEventHandler(SocketEvent.Error);
          errorHandler(socket, `Handler not found for event '${name}'.`);
        }
      },
      error => {
        const errorHandler = getSocketEventHandler(SocketEvent.Error);
        errorHandler(socket, `Handler not found for event '${name}'.`);
      },
      () => {
        const closeHandler = getSocketEventHandler(SocketEvent.Close);
        closeHandler(socket);
      },
    );
  });

  const server = new WebSocket.Server(options);

  server.on('listening', () =>
    console.log(`ws-todo-server listening on port ${options.port}`)
  );

  server.on('connection', (ws, req) => {
    ws$subject.next({
      socket: ws,
      request: req
    });
  });
};
