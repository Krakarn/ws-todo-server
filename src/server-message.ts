export enum ServerMessageType {
  Success = 'success',
  Error = 'error',
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
}

export interface IServerMessage {
  type: ServerMessageType;
}

export interface IServerSuccessMessage extends IServerMessage {
  type: ServerMessageType.Success;
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

export interface ISubscription {
  id: number;
  table: string;
  filter?: string;
}
