import * as http from 'http';
import * as Rx from 'rxjs';
import * as WebSocket from 'ws';

const options = {
  port: 8090,
};

const server = new WebSocket.Server(options);

server.on('listening', () => console.log(`Server listening on port ${options.port}`));

export interface ISocketConnected {
  socket: WebSocket;
  request: http.IncomingMessage;
}

const ws$ = new Rx.Subject<ISocketConnected>();

server.on('connection', (ws, req) => {
  ws$.next({
    socket: ws,
    request: req
  });
});

ws$.subscribe(({socket, request}) => {
  socket.on('open', () => console.log('Client connected.'));
  socket.on('close', () => console.log('Client disconnected.'));
  socket.on('error', error => console.error('Client error:', error));
  socket.on('message', message => console.log('Client message:', message));

  socket.send('welcome');
});
