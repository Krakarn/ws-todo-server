import { getParserHistory as gph } from '../lang/history';
import { parser } from './parser';
import { tokenRules } from './token-rules';

export const getParserHistory = (s: string) => gph(s, tokenRules, parser);
