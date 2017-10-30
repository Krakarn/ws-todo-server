import { ILibraryLoader } from '../../lang/library';
import {
  createType,
  ITypeDefinition,
  ITypeEvaluationState,
} from '../../lang/type';
import { EvaluationState } from '../evaluation-state';

export interface INativeLibrary<T> {
  state: {
    '(+)'(x: any): (y: any) => any;
    '(-)'(x: any): (y: any) => any;
    '(*)'(x: any): (y: any) => any;
    '(/)'(x: any): (y: any) => any;
    '(==)'(x: any): (y: any) => any;
    '(!=)'(x: any): (y: any) => any;
    '(<)'(x: any): (y: any) => any;
    '(<=)'(x: any): (y: any) => any;
    '(>)'(x: any): (y: any) => any;
    '(>=)'(x: any): (y: any) => any;
    'if'(x: any): (y: any) => any;
  } & T;
}

export const loadLibrary = <T extends EvaluationState>(
  state: T
): T & INativeLibrary<{}> => {
  state.state['(+)'] = x => y => x + y;
  state.state['(-)'] = x => y => x - y;
  state.state['(*)'] = x => y => x * y;
  state.state['(/)'] = x => y => x / y;
  state.state['(==)'] = x => y => x === y;
  state.state['(!=)'] = x => y => x !== y;
  state.state['(<)'] = x => y => x < y;
  state.state['(<=)'] = x => y => x <= y;
  state.state['(>)'] = x => y => x > y;
  state.state['(>=)'] = x => y => x >= y;
  state.state['if'] = p => b => e => p ? b : e;

  return state as T & INativeLibrary<{}>;
};

const createFunctionType = <T>(
  parameterType: ITypeDefinition,
  returnType: T
): (x: ITypeDefinition) => T => {
  return x => {
    parameterType.matchType(x);

    return returnType;
  };
};

export const loadLibraryTypes = (
  state: ITypeEvaluationState,
): ITypeEvaluationState => {
  state.types['any'] = createType('any', () => void 0);
  state.types['number'] = createType('number');
  state.types['string'] = createType('string');
  state.types['boolean'] = createType('boolean');
  state.types['null'] = createType('null');

  state.state['(+)'] = createFunctionType(
    state.types['number'],
    createFunctionType(
      state.types['number'],
      state.types['number']
    )
  );

  return state;
};
