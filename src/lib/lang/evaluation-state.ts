export interface IEvaluationState {
  state: {[index:string]: any};
  clone<T extends IEvaluationState>(): T;
}
