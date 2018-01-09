import { IEvaluationState } from './evaluation-state';

export const accessIdentifier = <T extends IEvaluationState, U>(
  identifier: string,
  state: T,
): U =>
  state.state[identifier]
;

export abstract class Expression<T extends IEvaluationState, U> {
  public abstract evaluate(state: T): U;
  public abstract toString(): string;
}
