import { IEvaluationState } from './evaluation-state';
import { Expression } from './syntax';

export interface ITypeEvaluationState extends IEvaluationState {
  state: {[index:string]: ITypeDefinition | any};
  types: {[index:string]: ITypeDefinition | any};
}

export class TypeEvaluationState implements ITypeEvaluationState {
  public state: {[index:string]: any};
  public types: {[index:string]: any};

  constructor(
    state: {[index:string]: any} = {},
    types: {[index:string]: any} = {},
  ) {
    this.state = {...state};
    this.types = {...types};
  }

  public clone<T extends IEvaluationState>(): T {
    return new TypeEvaluationState(
      this.state,
      this.types,
    ) as any;
  }
}

export const accessType = <T = ITypeDefinition>(
  identifier: string,
  state: ITypeEvaluationState,
): T =>
  state.types[identifier]
;

export interface ITypeDefinition {
  name: string;
  children: ITypeDefinition[];
  meta: ITypeMeta;
  matchType(withType: ITypeDefinition): void;
}

export interface ITypeMeta {
  infixPrecedence?: number;
}

export abstract class TypeExpression<T = any> extends Expression<ITypeEvaluationState, T> {}

export abstract class TypedExpression<
  T extends IEvaluationState,
  U,
  W extends TypeExpression<V>,
  V = any
> extends Expression<T, U> {
  public type: W;

  constructor(type: W) {
    super();

    this.type = type;
  }

  public evaluateType(state: ITypeEvaluationState): V {
    return (this.type as any).evaluate(state);
  }
}

export const createType = (
  name: string,
  customMatcher?: (otherType: ITypeDefinition) => void,
  meta: ITypeMeta = {},
): ITypeDefinition => {
  return {
    name,
    children: [] as ITypeDefinition[],
    meta,
    matchType: customMatcher,
  };
};

export const reduceType = (
  expected: ITypeDefinition,
  actual: ITypeDefinition,
  typesChecked: any[] = [],
): ITypeDefinition => {
  if (expected === actual) {
    return expected;
  }

  if (expected.matchType) {
    try {
      expected.matchType(actual);

      return actual;
    } catch (e) {
    }
  }

  let descendantMatch: ITypeDefinition;

  expected.children.forEach(child => {
    if (typesChecked.indexOf(child) !== -1) {
      return;
    }

    typesChecked.push(child);

    try {
      descendantMatch = reduceType(
        expected,
        child,
        typesChecked
      );
    } catch (e) {
    }
  });

  if (descendantMatch) {
    return descendantMatch;
  }

  throw new Error(
    `Couldn't match type ${
      actual.toString()
    } with expected type ${
      expected.toString()
    }`
  );
};
