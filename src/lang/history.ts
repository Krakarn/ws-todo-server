import { _parse, IParser } from './parser';
import { ITokenRule, tokenize } from './tokenizer';

export const getParserHistory = (
  s: string,
  tokenRules: ITokenRule[],
  parser: IParser<any>,
) => {
  return _parse(tokenize(s, tokenRules), parser).state.history;
};
