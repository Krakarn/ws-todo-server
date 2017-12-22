import {
  ISerializedSubscription,
  ISubscription,
} from './subscription';

import { IStateCollectionEvent } from './state';

export enum ServerMessageType {
  Debug = 'debug',
  Error = 'error',
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
  SubscriptionEvent = 'subscription-event',
}

export interface IServerMessage {
  handle?: string;
  type: ServerMessageType;
}

export interface IServerDebugMessage extends IServerMessage {
  type: ServerMessageType.Debug;
  message: string;
}

export interface IServerErrorMessage extends IServerMessage {
  type: ServerMessageType.Error;
  error: string;
  evaluationState?: any;
}

export interface IServerSubscribeResponse extends IServerMessage {
  type: ServerMessageType.Subscribe;
  subscription: ISerializedSubscription;
}

export interface IServerUnsubscribeResponse extends IServerMessage {
  type: ServerMessageType.Unsubscribe;
  subscription: ISerializedSubscription;
}

export interface IServerSubscriptionEventResponse<T> extends IServerMessage {
  type: ServerMessageType.SubscriptionEvent;
  subscriptionId: string;
  event: T;
}
