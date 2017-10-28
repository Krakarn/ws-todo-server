import { parser } from '../lang-standard/parser';
import { tokenRules } from '../lang-standard/token-rules';

import { stringToExpression as ste } from '../lang/string-to-expression';

export const stringToExpression =
  s => ste(s, parser, tokenRules)
;
