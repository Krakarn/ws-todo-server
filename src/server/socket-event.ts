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
