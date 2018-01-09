import { Expression } from '../lang-filter/syntax';
import { IEvaluationState } from '../lang/evaluation-state';

import {
  convertRawClientMessage,
  validateRawClientMessage
} from './client-message-raw';
import { ClientMessageType } from './client-message-type';

export interface IClientMessage {
  handle?: string;
  type: ClientMessageType;
}

export interface IClientDebugMessage<T extends IEvaluationState, U> extends IClientMessage {
  type: ClientMessageType.Debug;
  expression: Expression<T, U>;
}

export interface IClientTableMessage extends IClientMessage {
  table: string;
}

export interface IClientSubscribeMessage<
  T extends IEvaluationState
> extends IClientTableMessage {
  type: ClientMessageType.Subscribe;
  filter?: Expression<T, boolean>;
}

export interface IClientUnsubscribeMessage extends IClientMessage {
  type: ClientMessageType.Unsubscribe;
  subscriptionId: string;
}

export interface IClientItemMessage<T> extends IClientTableMessage {
  item: T;
}

export interface IClientCreateMessage<T> extends IClientItemMessage<T> {
  type: ClientMessageType.Create;
}

export interface IClientUpdateMessage<T> extends IClientItemMessage<T> {
  type: ClientMessageType.Update;
}

export interface IClientDeleteMessage extends IClientTableMessage {
  type: ClientMessageType.Delete;
  id: string;
}

export const stringToClientMessage = <T extends IEvaluationState>(
  rawClientMessageString: string,
  stringToExpression: (s: string) => Expression<T, boolean>,
): IClientMessage => {
  const rawClientMessage = JSON.parse(rawClientMessageString);

  validateRawClientMessage(rawClientMessage);

  return convertRawClientMessage(rawClientMessage, stringToExpression);
};
