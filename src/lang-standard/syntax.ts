import { Expression } from '../lang/syntax';
export { Expression } from '../lang/syntax';

import { IEvaluationState } from '../lang/evaluation-state';

export abstract class LiteralExpression<T extends IEvaluationState, U> extends Expression<T, U> {}

export class PrimitiveExpression<T extends IEvaluationState, U> extends LiteralExpression<T, U> {
  public value: U;

  constructor(value: U) {
    super();
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
  public expressions: Expression<T, U>[];

  constructor(expressions: Expression<T, U>[]) {
    super();
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

export class IdentifierExpression<T extends IEvaluationState, U> extends Expression<T, U> {
  public identifier: string;

  constructor(identifier: string) {
    super();
    this.identifier = identifier;
  }

  public evaluate(state) {
    return state[this.identifier];
  }

  public toString() {
    return this.identifier;
  }
}

export class LetExpression<T extends IEvaluationState, U, V> extends Expression<T, V> {
  public boundExpression: Expression<T, U>;
  public functionExpression: FunctionExpression<T, U, V>;

  constructor(
    boundExpression: Expression<T, U>,
    functionExpression: FunctionExpression<T, U, V>,
  ) {
    super();
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
> extends Expression<T, (parameter: U) => V> {
  public parameterIdentifier: string;
  public bodyExpression: Expression<T, V>;

  constructor(
    parameterIdentifier: string,
    bodyExpression: Expression<T, V>,
  ) {
    super();

    this.parameterIdentifier = parameterIdentifier;
    this.bodyExpression = bodyExpression;
  }

  public evaluate(state: T) {
    return (parameter: U) => {
      const clonedState = state.clone() as T;

      clonedState[this.parameterIdentifier] = parameter;

      return this.bodyExpression.evaluate(clonedState);
    };
  }

  public toString() {
    return `\\${this.parameterIdentifier} -> ${this.bodyExpression.toString()}`;
  }
}

export abstract class WrappedExpression<
  T extends IEvaluationState,
  U
> extends Expression<T, U> {
  public innerExpression: Expression<T, U>;

  constructor(innerExpression: Expression<T, U>) {
    super();

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
> extends Expression<T, V> {
  public functionExpression: Expression<T, (u: U) => V>;
  public argumentExpression: Expression<T, U>;

  constructor(
    functionExpression: Expression<T, (u: U) => V>,
    argumentExpression: Expression<T, U>,
  ) {
    super();

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
