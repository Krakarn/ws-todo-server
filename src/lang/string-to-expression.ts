import { IEvaluationState } from './evaluation-state';
import { IParser, parse } from './parser';
import { Expression } from './syntax';
import { ITokenRule, tokenize } from './tokenizer';

export const stringToExpression = <T extends IEvaluationState, U>(
  s: string,
  parser: IParser<Expression<T, U>>,
  tokenRules: ITokenRule[],
): Expression<T, U> =>
  parse(tokenize(s, tokenRules), parser)
;
