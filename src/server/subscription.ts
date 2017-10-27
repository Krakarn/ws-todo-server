import { IEvaluationState } from '../lang/evaluation-state';
import { Expression } from '../lang/syntax';

export interface ISerializedSubscription {
  id: string;
  table: string;
  filter?: string;
}

export interface ISubscription<T extends IEvaluationState> {
  id: string;
  table: string;
  filter?: Expression<T, boolean>;
}

export const serializeSubscription = <T extends IEvaluationState>(
  subscription: ISubscription<T>,
): ISerializedSubscription => {
  return {
    id: subscription.id,
    table: subscription.table,
    filter: subscription.filter ?
      subscription.filter.toString() :
      void 0,
  };
};

export const deserializeSubscription = <T extends IEvaluationState>(
  subscription: ISerializedSubscription,
  stringToExpression: (filterString: string) => Expression<T, boolean>,
): ISubscription<T> => {
  return {
    id: subscription.id,
    table: subscription.table,
    filter: subscription.filter ?
      stringToExpression(subscription.filter) :
      void 0,
  };
};
