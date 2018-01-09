import { accessIdentifier, Expression } from '../lang/syntax';
export { Expression } from '../lang/syntax';

import { IEvaluationState } from '../lang/evaluation-state';
import {
  TypedExpression,
  TypeExpression,
} from '../lang/type';

import {
  ApplyTypeExpression,
  FunctionLabeledTypeExpression,
  FunctionTypeExpression,
  LetTypeExpression,
  StateIdentifierTypeExpression,
  TypeIdentifierTypeExpression,
} from './type';

export abstract class LiteralExpression<T extends IEvaluationState, U> extends TypedExpression<T, U, TypeExpression> {}

export class PrimitiveExpression<T extends IEvaluationState, U> extends LiteralExpression<T, U> {
  public value: U;
  public type: TypeIdentifierTypeExpression;

  constructor(
    value: U,
  ) {
    const type = value === null ? 'null' : typeof value;
    super(new TypeIdentifierTypeExpression(type));

    this.value = value;
  }

  public evaluate(state: T) {
    return this.value;
  }

  public toString() {
    const t = typeof this.value;

    switch (t) {
      case 'string': return `\`${this.value}\``;
      default: return JSON.stringify(this.value);
    }
  }
}

export class ListExpression<T extends IEvaluationState, U> extends LiteralExpression<T, U[]> {
  public expressions: TypedExpression<T, U, TypeExpression>[];

  constructor(
    expressions: TypedExpression<T, U, TypeExpression>[],
  ) {
    super(new TypeIdentifierTypeExpression('any'));

    this.expressions = expressions;
  }

  public evaluate(state: T) {
    return this.expressions.map(e => e.evaluate(state));
  }

  public toString() {
    return `[${
      this.expressions
        .map(e => e.toString())
        .join(', ')
    }]`;
  }
}

export class IdentifierExpression<T extends IEvaluationState, U> extends TypedExpression<T, U, StateIdentifierTypeExpression> {
  public identifier: string;

  constructor(
    identifier: string,
  ) {
    super(new StateIdentifierTypeExpression(identifier));

    this.identifier = identifier;
  }

  public evaluate(state: T) {
    return accessIdentifier<T, U>(this.identifier, state);
  }

  public toString() {
    return this.identifier;
  }
}

export class InfixIdentifierExpression<T extends IEvaluationState, U> extends IdentifierExpression<T, U> {
  public evaluate(state: T) {
    return accessIdentifier<T, U>(`(${this.identifier})`, state);
  }
}

export class LetExpression<
  T extends IEvaluationState,
  U,
  V,
  W extends LetTypeExpression<any, any>
> extends TypedExpression<T, V, W> {
  public boundExpression: TypedExpression<T, U, W>;
  public functionExpression: FunctionExpression<T, U, V>;

  constructor(
    boundExpression: TypedExpression<T, U, W>,
    functionExpression: FunctionExpression<T, U, V>,
  ) {
    super(new LetTypeExpression(
      functionExpression.type,
    ) as W);

    this.boundExpression = boundExpression;
    this.functionExpression = functionExpression;
  }

  public evaluate(state: T) {
    const boundValue = this.boundExpression.evaluate(state);
    const f = this.functionExpression.evaluate(state);

    return f(boundValue);
  }

  public toString() {
    return `let ${this.functionExpression.parameterIdentifier} = ${
      this.boundExpression.toString()
    } in ${this.functionExpression.bodyExpression.toString()}`;
  }
}

export class FunctionExpression<
  T extends IEvaluationState,
  U,
  V
> extends TypedExpression<T, (parameter: U) => V, FunctionLabeledTypeExpression<any>> {
  public parameterIdentifier: string;
  public bodyExpression: TypedExpression<T, V, TypeExpression>;

  constructor(
    parameterIdentifier: string,
    bodyExpression: TypedExpression<T, V, TypeExpression>,
    parameterType: TypeExpression,
  ) {
    super(new FunctionLabeledTypeExpression(
      parameterIdentifier,
      new FunctionTypeExpression(
        parameterType,
        bodyExpression.type,
      )
    ));

    this.parameterIdentifier = parameterIdentifier;
    this.bodyExpression = bodyExpression;
  }

  public evaluate(state: T) {
    return (parameter: U) => {
      const clonedState = state.clone() as T;

      clonedState.state[this.parameterIdentifier] = parameter;

      return this.bodyExpression.evaluate(clonedState);
    };
  }

  public toString() {
    return `\\${this.parameterIdentifier} (${this.type.functionType.parameterType.toString()}) -> ${this.bodyExpression.toString()}`;
  }
}

export abstract class WrappedExpression<
  T extends IEvaluationState,
  U,
  W extends TypeExpression = TypeExpression
> extends TypedExpression<T, U, W> {
  public innerExpression: TypedExpression<T, U, W>;

  constructor(innerExpression: TypedExpression<T, U, W>) {
    super(innerExpression.type);

    this.innerExpression = innerExpression;
  }

  public evaluate(state) {
    return this.innerExpression.evaluate(state);
  }
}

export class GroupExpression<
  T extends IEvaluationState,
  U
> extends WrappedExpression<T, U> {
  public toString() {
    return `(${this.innerExpression.toString()})`;
  }
}

export class ApplyExpression<
  T extends IEvaluationState,
  U,
  V
> extends TypedExpression<T, V, ApplyTypeExpression<any>> {
  public functionExpression: TypedExpression<T, (u: U) => V, FunctionLabeledTypeExpression<any>>;
  public argumentExpression: TypedExpression<T, U, TypeExpression>;

  constructor(
    functionExpression: TypedExpression<T, (u: U) => V, FunctionLabeledTypeExpression<any>>,
    argumentExpression: TypedExpression<T, U, TypeExpression>,
  ) {
    super(new ApplyTypeExpression(
      functionExpression.type,
      argumentExpression.type,
    ));

    this.functionExpression = functionExpression;
    this.argumentExpression = argumentExpression;
  }

  public evaluate(state) {
    const f = this.functionExpression.evaluate(state);

    if (typeof f !== 'function') {
      throw new Error(`Type Error: Trying to apply to a non-function`);
    }

    const argument = this.argumentExpression.evaluate(state);

    return f(argument);
  }

  public toString() {
    return `${this.functionExpression.toString()} ${this.argumentExpression.toString()}`;
  }
}

export class ApplyInfixExpression<T extends IEvaluationState, U, V> extends ApplyExpression<T, U, V> {
  public toString() {
    return `${this.argumentExpression.toString()} ${this.functionExpression.toString()}`;
  }
}
