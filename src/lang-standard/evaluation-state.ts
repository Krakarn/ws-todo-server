import { IEvaluationState } from '../lang/evaluation-state';

export class EvaluationState implements IEvaluationState {
  public state: {[index:string]: any};

  constructor(state: {[index:string]: any} = {}) {
    this.state = {...state};
  }

  public clone() {
    return new EvaluationState(this.state);
  }
}
