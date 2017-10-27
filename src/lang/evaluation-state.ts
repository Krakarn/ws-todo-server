export interface IEvaluationState {
  state: {[index:string]: any};
  clone(): IEvaluationState;
}
