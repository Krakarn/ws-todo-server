import { Expression } from '../lang/syntax';
export { Expression } from '../lang/syntax';

export abstract class LiteralExpression<T, U> extends Expression<T, U> {}

export class PrimitiveExpression<T, U> extends LiteralExpression<T, U> {
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

export class ListExpression<T, U> extends LiteralExpression<T, U[]> {
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

export class IdentifierExpression<T, U> extends Expression<T, U> {
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

export class ApplyExpression<T, U, V, W> extends Expression<T, W> {
  public objectExpression: Expression<T, U> | void;
  public identifierExpression: Expression<T, any>;
  public valueExpression: Expression<T, V>;
  public operatorExpression: Expression<T, (object: U, identifier: any, value: V) => W>;

  constructor(
    objectExpression: Expression<T, U> | void,
    identifierExpression: Expression<T, any>,
    valueExpression: Expression<T, V>,
    operatorExpression: Expression<T, (object: U, identifier: any, value: V) => W>,
  ) {
    super();
    this.objectExpression = objectExpression;
    this.identifierExpression = identifierExpression;
    this.valueExpression = valueExpression;
    this.operatorExpression = operatorExpression;
  }

  public evaluate(state: T) {
    const object = this.objectExpression ?
      this.objectExpression.evaluate(state) :
      state as any
    ;
    const identifier = this.identifierExpression.evaluate(state);
    const value = this.valueExpression.evaluate(state);
    const operator = this.operatorExpression.evaluate(state);

    return operator(object, identifier, value);
  }

  public toString() {
    return `${this.objectExpression ?
      `(${this.objectExpression.toString()}[${this.identifierExpression.toString()}]` :
      `(${this.identifierExpression.toString()}`
    } ${this.operatorExpression.toString()} ${this.valueExpression.toString()})`;
  }
}
