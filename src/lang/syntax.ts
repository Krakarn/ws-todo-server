import { IEvaluationState } from './evaluation-state';

export abstract class Expression<T extends IEvaluationState, U> {
  public abstract evaluate(state: T): U;
  public abstract toString(): string;
}
