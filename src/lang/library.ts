import { IEvaluationState } from './evaluation-state';

export interface ILibraryLoader<T extends IEvaluationState, U> {
  (state: T): T & U;
}
