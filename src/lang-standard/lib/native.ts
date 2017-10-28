import { ILibraryLoader } from '../../lang/library';
import { EvaluationState } from '../evaluation-state';

export interface INativeLibrary<T> {
  state: {
    '(+)'(x: any): (y: any) => any;
    '(-)'(x: any): (y: any) => any;
    '(*)'(x: any): (y: any) => any;
    '(/)'(x: any): (y: any) => any;
  } & T;
}

export const loadLibrary = <T extends EvaluationState>(
  state: T
): T & INativeLibrary<{}> => {
  state.state['(+)'] = x => y => x + y;
  state.state['(-)'] = x => y => x - y;
  state.state['(*)'] = x => y => x * y;
  state.state['(/)'] = x => y => x / y;

  return state as T & INativeLibrary<{}>;
};
