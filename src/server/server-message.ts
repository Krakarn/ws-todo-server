import { ISubscription } from './subscription';

export enum ServerMessageType {
  Error = 'error',
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
}

export interface IServerMessage {
  type: ServerMessageType;
}

export interface IServerErrorMessage extends IServerMessage {
  type: ServerMessageType.Error;
  error: string;
}

export interface IServerSubscribeResponse extends IServerMessage {
  type: ServerMessageType.Subscribe;
  subscription: ISubscription;
}

export interface IServerUnsubscribeResponse extends IServerMessage {
  type: ServerMessageType.Unsubscribe;
  subscription: ISubscription;
}
