import { IEvaluationState } from './evaluation-state';

export interface ILibraryExtender<T extends IEvaluationState, U> {
  (state: T): T & U;
}

export const loadLibrary = <T extends IEvaluationState, U>(
  state: T,
  library: ILibraryExtender<T, U>,
): T & U => {
  return library(state);
};
