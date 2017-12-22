import { IRawClientMessage } from './client-message-raw';
import { ClientMessageType } from './client-message-type';

const validateTypeof = (name: string, types: string[], value: any) => {
  const valueTypeof = typeof value;

  if (types.every(type => type !== valueTypeof)) {
    throw new Error(`Invalid ${name} property type "${
      valueTypeof
    }", should be ${
      types.length === 1 ?
        `"${types[0]}"` :
        types.length > 1 ?
        `either ${types.slice(0, -1).map(t => `"${t}"`).join(', ')} or "${types.slice(-1)[0]}"` :
        ''
    }.`);
  }
};

const validateGeneric = (msg: IRawClientMessage) => {
  validateTypeof('handle', ['string', 'undefined'], msg.handle);
};

const validateTable = (table: any) => {
  validateTypeof('table', ['string'], table);

  if (table === '') {
    throw new Error(`Invalid table property value "${
      table
    }", should be a non-empty string.`);
  }
};

const validateFilter = (filter: any) => {
  validateTypeof('filter', ['undefined', 'string'], filter);
};

const validateSubscriptionId = (subscriptionId: any) => {
  validateTypeof('subscriptionId', ['string'], subscriptionId);
};

const validateItem = (item: any) => {
  validateTypeof('item', ['object'], item);
};

const validateId = (id: any) => {
  validateTypeof('id', ['string'], id);
};

export const validators: {
  [clientMessageType: string]: (msg: IRawClientMessage) => void;
} = {
  [ClientMessageType.Debug]: msg => {
    validateGeneric(msg);
    validateTypeof('expression', ['string'], msg.expression);
  },

  [ClientMessageType.Subscribe]: msg => {
    validateGeneric(msg);
    validateTable(msg.table);
    validateFilter(msg.filter);
  },

  [ClientMessageType.Unsubscribe]: msg => {
    validateGeneric(msg);
    validateSubscriptionId(msg.subscriptionId);
  },

  [ClientMessageType.Create]: msg => {
    validateGeneric(msg);
    validateTable(msg.table);
    validateItem(msg.item);
  },

  [ClientMessageType.Update]: msg => {
    validateGeneric(msg);
    validateTable(msg.table);
    validateItem(msg.item);
  },

  [ClientMessageType.Delete]: msg => {
    validateGeneric(msg);
    validateTable(msg.table);
    validateId(msg.id);
  },
};
