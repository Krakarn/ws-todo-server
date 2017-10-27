import { parse } from '../lang/parser';
import { tokenize } from '../lang/tokenizer';
export * from '../lang-standard/parser';
import { parser } from '../lang-standard/parser';
import { tokenRules } from '../lang-standard/token-rules';

export const stringToExpression = (s: string) =>
  parse(tokenize(s, tokenRules), parser)
;
