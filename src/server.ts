import * as http from 'http';
import * as Rx from 'rxjs';
import * as uuid from 'uuid/v4';
import * as WebSocket from 'ws';

import { IClient } from './server/client';

import { ITables, State } from './server/state';

import { ISocketEvent, SocketEvent } from './server/socket-event';
import { getSocketEventHandler } from './server/socket-event-handlers';

import { IEvaluationState } from './lang/evaluation-state';

export interface IServerOptions {
  port?: number;
}

const defaultOptions: IServerOptions = {
  port: 8090,
};

export interface ISocketConnected {
  socket: WebSocket;
  request: http.IncomingMessage;
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

const rxConstant = <T>(sourceFn: () => Rx.Observable<T>) => Rx.Observable
  .merge(
    Rx.Observable.defer(sourceFn),
    Rx.Observable.never(),
  )
  .share()
;

export const server = <T extends ITables, U extends IEvaluationState>(
  state: State<T, U>,
  options?: IServerOptions,
): Rx.Observable<ISocketEvent<any>> => {
  options = {...defaultOptions, ...options};

  const server$ =
    rxConstant(() => {
      const s = new WebSocket.Server(options);

      s.on('listening', () =>
        console.log(`ws-todo-server listening on port ${options.port}`)
      );

      s.on('connection', (ws, req) => {
        ws$subject.next({
          socket: ws,
          request: req
        });
      });

      return Rx.Observable.of(s);
    })
    .switchMap(server => ws$
      .mergeMap(({socket, socket$}) => {
        const client: IClient = {
          id: uuid(),
          socket,
        };

        return socket$
          .do(({name, payload}) => {
            const handler = getSocketEventHandler(name);

            if (handler) {
              handler(state, client, payload);
            } else {
              const errorHandler = getSocketEventHandler(SocketEvent.Error);
              errorHandler(state, client, `Handler not found for event '${name}'.`);
            }
          })
          .catch<ISocketEvent<any>, ISocketEvent<any>>(error => {
            const errorHandler = getSocketEventHandler(SocketEvent.Error);
            errorHandler(state, client, `Handler not found for event '${name}'.`);

            throw error;
          })
          .finally(() => {
            const closeHandler = getSocketEventHandler(SocketEvent.Close);
            closeHandler(state, client);

            return void 0;
          })
        ;
      })
    )
  ;

  return server$;
};
