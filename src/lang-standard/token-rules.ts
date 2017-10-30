import { ITokenRule } from '../lang/tokenizer';

export enum Token {
  WhiteSpaceSpace = 'white-space-space',
  WhiteSpaceEndline = 'white-space-endline',
  WhiteSpaceOther = 'white-space-other',
  Number = 'number',
  String = 'string',
  Identifier = 'identifier',
  Symbol = 'symbol',
}

export const tokenRules: ITokenRule[] = [
  { name: Token.WhiteSpaceSpace, test: /^ +/ },
  { name: Token.WhiteSpaceEndline, test: /^\n+/ },
  { name: Token.WhiteSpaceOther, test: /^\s/ },
  { name: Token.Number, test: /^-?[1-9][0-9]*\.?[0-9]*/, toValue: parseFloat },
  { name: Token.String, test: /^`([^`]*)`/ },
  { name: Token.Identifier, test: /^\w+/ },
  { name: Token.Symbol, test: /^[\[\]\(\)\{\}\!\?\&\^\-\+\*\$\\\/\,\.\=\<\>\:\;]/ },
];
