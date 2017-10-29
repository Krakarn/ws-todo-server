import { IEvaluationState } from './evaluation-state';
import { Expression } from './syntax';

export interface ITypeEvaluationState extends IEvaluationState {
  state: {[index:string]: ITypeDefinition};
}

export interface ITypeDefinition {
  name: string;
  children: ITypeDefinition[];
  meta: ITypeMeta;
}

export interface ITypeMeta {
  infixPrecedence?: number;
}

export abstract class TypeExpression extends Expression<
  ITypeEvaluationState,
  ITypeDefinition
> {}
