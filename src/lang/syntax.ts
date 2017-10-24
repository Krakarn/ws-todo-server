export abstract class Expression<T, U> {
  public abstract evaluate(state: T): U;
  public abstract toString(): string;
}
