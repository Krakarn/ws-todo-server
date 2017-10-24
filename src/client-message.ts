import { parse } from './lang/parser';

import { tokenize } from './lang/tokenizer';

import { parser } from './lang-filter/parser';
import { Expression } from './lang-filter/syntax';
import { tokenRules } from './lang-filter/token-rules';

import { IStateItem } from './state';

export enum ClientMessageType {
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
}

export interface IClientMessage {
  type: ClientMessageType;
}

export interface IClientSubscribeMessage<T> extends IClientMessage {
  type: ClientMessageType.Subscribe;
  table: string;
  filter?: Expression<T, boolean>;
}

export interface IClientUnsubscribeMessage extends IClientMessage {
  type: ClientMessageType.Unsubscribe;
  subscriptionId: number;
}

interface IRawClientMessage {
  type: ClientMessageType;
  [index:string]: any;
}

const validators: {
  [clientMessageType: string]: (msg: IRawClientMessage) => void;
} = {
  [ClientMessageType.Subscribe]: msg => {
    const tableTypeof = typeof msg.table;

    if (tableTypeof !== 'string') {
      throw new Error(`Invalid table property type "${
        tableTypeof
      }", should be "string".`);
    }

    const filterTypeof = typeof msg.filter;

    if (filterTypeof !== 'undefined' && filterTypeof !== 'string') {
      throw new Error(`Invalid filter property type "${
        filterTypeof
      }", should be either "undefined" or "string".`);
    }
  },

  [ClientMessageType.Unsubscribe]: msg => {
    const subscriptionIdTypeof =
      typeof msg.subscriptionId
    ;

    if (subscriptionIdTypeof !== 'number') {
      throw new Error(`Invalid table property type "${
        subscriptionIdTypeof
      }", should be "number".`);
    }
  },
};

const validateRawClientMessage = (clientMessage: IRawClientMessage) => {
  const validator = validators[clientMessage.type];

  if (!validator) {
    const messageTypes = JSON.stringify(ClientMessageType, null, 2);

    throw new Error(`Invalid client message type "${clientMessage.type}", should be any of:\n${messageTypes}`);
  }

  validator(clientMessage);
};

const convertRawClientMessage = <T>(
  rawClientMessage: IRawClientMessage
): IClientMessage => {
  switch(rawClientMessage.type) {
    case ClientMessageType.Subscribe:
      return {
        type: ClientMessageType.Subscribe,
        table: rawClientMessage.table,
        filter: rawClientMessage.filter ?
          parse(
            tokenize(rawClientMessage.filter, tokenRules),
            parser
          ) :
          void 0,
      } as IClientSubscribeMessage<T>;

    case ClientMessageType.Unsubscribe:
      return {
        type: ClientMessageType.Unsubscribe,
        subscriptionId: rawClientMessage.subscriptionId,
      } as IClientUnsubscribeMessage;

    default:
      throw new Error(`Unhandled client message type "${rawClientMessage.type}".`);
  }
};

export const stringToClientMessage = (
  rawClientMessageString: string
): IClientMessage => {
  const rawClientMessage = JSON.parse(rawClientMessageString);

  validateRawClientMessage(rawClientMessage);

  return convertRawClientMessage(rawClientMessage);
};
