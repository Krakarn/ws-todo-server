import { IEvaluationState } from '../lang/evaluation-state';
import { Expression } from '../lang/syntax';

import {
  IClientCreateMessage,
  IClientDebugMessage,
  IClientDeleteMessage,
  IClientMessage,
  IClientSubscribeMessage,
  IClientUnsubscribeMessage,
  IClientUpdateMessage,
} from './client-message';
import { ClientMessageType } from './client-message-type';
import { validators } from './client-message-validators';

export interface IRawClientMessage {
  handle?: string;
  type: ClientMessageType;
  [index:string]: any;
}

export const validateRawClientMessage = (clientMessage: IRawClientMessage) => {
  const validator = validators[clientMessage.type];

  if (!validator) {
    const messageTypes = JSON.stringify(ClientMessageType, null, 2);

    throw new Error(`Invalid client message type "${clientMessage.type}", should be any of:\n${messageTypes}`);
  }

  validator(clientMessage);
};

export const convertRawClientMessage = <T extends IEvaluationState>(
  rawClientMessage: IRawClientMessage,
  stringToExpression: (s: string) => Expression<T, boolean>,
): IClientMessage => {
  switch(rawClientMessage.type) {
    case ClientMessageType.Debug:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Debug,
        expression: stringToExpression(rawClientMessage.expression)
      } as IClientDebugMessage<T, any>;

    case ClientMessageType.Subscribe:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Subscribe,
        table: rawClientMessage.table,
        filter: rawClientMessage.filter ?
          stringToExpression(rawClientMessage.filter) :
          void 0,
      } as IClientSubscribeMessage<T>;

    case ClientMessageType.Unsubscribe:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Unsubscribe,
        subscriptionId: rawClientMessage.subscriptionId,
      } as IClientUnsubscribeMessage;

    case ClientMessageType.Create:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Create,
        table: rawClientMessage.table,
        item: rawClientMessage.item,
      } as IClientCreateMessage<any>;

    case ClientMessageType.Update:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Update,
        table: rawClientMessage.table,
        item: rawClientMessage.item,
      } as IClientUpdateMessage<any>;

    case ClientMessageType.Delete:
      return {
        handle: rawClientMessage.handle,
        type: ClientMessageType.Delete,
        table: rawClientMessage.table,
        id: rawClientMessage.id,
      } as IClientDeleteMessage;

    default:
      throw new Error(`Unhandled client message type "${rawClientMessage.type}".`);
  }
};
