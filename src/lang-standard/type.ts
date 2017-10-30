import { IEvaluationState } from '../lang/evaluation-state';
import { accessIdentifier } from '../lang/syntax';
import {
  accessType,
  ITypeDefinition,
  ITypeEvaluationState,
  reduceType,
  TypeExpression,
} from '../lang/type';

abstract class IdentifierTypeExpression<T> extends TypeExpression<T> {
  public identifier: string;

  constructor(identifier: string) {
    super();

    this.identifier = identifier;
  }

  public toString() {
    return this.identifier;
  }
}

export class TypeIdentifierTypeExpression<T = ITypeDefinition> extends IdentifierTypeExpression<T> {
  public evaluate(state: ITypeEvaluationState): T {
    return accessType(this.identifier, state) as T;
  }
}

export class StateIdentifierTypeExpression<T = ITypeDefinition> extends IdentifierTypeExpression<T> {
  public evaluate(state: ITypeEvaluationState): T {
    return accessIdentifier(this.identifier, state) as T;
  }

  public toString() {
    return `typeof ${this.identifier}`;
  }
}

export class FunctionTypeExpression<T> extends TypeExpression<(argumentIdentifier: string, argumentType: ITypeDefinition) => T> {
  public parameterType: TypeExpression;
  public bodyType: TypeExpression;

  constructor(
    parameterType: TypeExpression,
    bodyType: TypeExpression,
  ) {
    super();

    this.parameterType = parameterType;
    this.bodyType = bodyType;
  }

  public evaluate(state: ITypeEvaluationState): (argumentIdentifier: string, argument: ITypeDefinition) => T {
    return (argumentIdentifier: string, argumentType: ITypeDefinition): T => {
      const parameterType = this.parameterType.evaluate(state);
      reduceType(parameterType, argumentType);

      const clonedState = state.clone() as ITypeEvaluationState;
      clonedState.state[argumentIdentifier] = argumentType;

      const bodyType = this.bodyType.evaluate(clonedState);

      return bodyType;
    };
  }

  public toString() {
    return `${this.parameterType.toString()} -> ${this.bodyType.toString()}`;
  }
}

export class FunctionLabeledTypeExpression<T> extends TypeExpression<(argumentType: ITypeDefinition) => T> {
  public parameterIdentifier: string;
  public functionType: FunctionTypeExpression<T>;

  constructor(
    parameterIdentifier: string,
    functionType: FunctionTypeExpression<T>,
  ) {
    super();

    this.parameterIdentifier = parameterIdentifier;
    this.functionType = functionType;
  }

  public evaluate(state: ITypeEvaluationState): (argumentType: ITypeDefinition) => T {
    const functionType = this.functionType.evaluate(state);

    return functionType.bind(functionType, this.parameterIdentifier);
  }

  public toString() {
    return this.functionType.toString();
  }
}

export class LetTypeExpression<T, U> extends TypeExpression<U> {
  public functionType: FunctionLabeledTypeExpression<U>;

  constructor(
    functionType: FunctionLabeledTypeExpression<U>,
  ) {
    super();

    this.functionType = functionType;
  }

  public evaluate(state: ITypeEvaluationState): U {
    const functionType = this.functionType.evaluate(state);
    const parameterType = this.functionType.functionType.parameterType.evaluate(state);

    return functionType(parameterType);
  }

  public toString() {
    return this.functionType.functionType.bodyType.toString();
  }
}

export class ApplyTypeExpression<T> extends TypeExpression<T> {
  public functionType: FunctionLabeledTypeExpression<T>;
  public argumentType: TypeExpression;

  constructor(
    functionType: FunctionLabeledTypeExpression<T>,
    argumentType: TypeExpression,
  ) {
    super();

    this.functionType = functionType;
    this.argumentType = argumentType;
  }

  public evaluate(state: ITypeEvaluationState): T {
    const functionType = this.functionType.evaluate(state);
    const argumentType = this.argumentType.evaluate(state);

    const bodyType = functionType(argumentType);

    return this.functionType.functionType.bodyType.evaluate(state);
  }

  public toString() {
    return this.functionType.functionType.bodyType.toString();
  }
}
