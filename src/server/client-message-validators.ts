import { IRawClientMessage } from './client-message-raw';
import { ClientMessageType } from './client-message-type';

const validateTable = (table: any) => {
  const tableTypeof = typeof table;

  if (tableTypeof !== 'string') {
    throw new Error(`Invalid table property type "${
      tableTypeof
    }", should be "string".`);
  }

  if (table === '') {
    throw new Error(`Invalid table property value "${
      table
    }", should be a non-empty string.`);
  }
};

const validateFilter = (filter: any) => {
  const filterTypeof = typeof filter;

  if (filterTypeof !== 'undefined' && filterTypeof !== 'string') {
    throw new Error(`Invalid filter property type "${
      filterTypeof
    }", should be either "undefined" or "string".`);
  }
};

const validateSubscriptionId = (subscriptionId: any) => {
  const subscriptionIdTypeof =
    typeof subscriptionId
  ;

  if (subscriptionIdTypeof !== 'string') {
    throw new Error(`Invalid subscriptionId property type "${
      subscriptionIdTypeof
    }", should be "string".`);
  }
};

const validateItem = (item: any) => {
  const itemTypeof = typeof item;

  if (itemTypeof !== 'object') {
    throw new Error(
      `Invalid item property type "${itemTypeof}", should be "object".`
    );
  }
};

const validateId = (id: any) => {
  const idTypeof = typeof id;

  if (idTypeof !== 'string') {
    throw new Error(
      `Invalid id property type "${idTypeof}", should be "string".`
    );
  }
};

export const validators: {
  [clientMessageType: string]: (msg: IRawClientMessage) => void;
} = {
  [ClientMessageType.Subscribe]: msg => {
    validateTable(msg.table);
    validateFilter(msg.filter);
  },

  [ClientMessageType.Unsubscribe]: msg => {
    validateSubscriptionId(msg.subscriptionId);
  },

  [ClientMessageType.Create]: msg => {
    validateTable(msg.table);
    validateItem(msg.item);
  },

  [ClientMessageType.Update]: msg => {
    validateTable(msg.table);
    validateItem(msg.item);
  },

  [ClientMessageType.Delete]: msg => {
    validateTable(msg.table);
    validateId(msg.id);
  },
};
