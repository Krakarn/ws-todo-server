import { EvaluationState } from '../evaluation-state';
import { ILibraryExtender } from '../../lang/library';
import { FunctionExpression, NativeExpression } from '../syntax';

const add: ILibraryExtender = (state: EvaluationState) =>
  new FunctionExpression(
    'x',
    new FunctionExpression(
      'y',
      new NativeExpression(
        state => state['x'] + state['y'],
        () => 'add',
      )
    ),
  )
;

export const loadLibrary = <T extends IEvaluationState>(state: T) => {
};
