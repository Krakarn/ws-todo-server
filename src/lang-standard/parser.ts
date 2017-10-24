import {
  IParser,
  IParserState,
  parseEOF,
  parseList,
  parseOr,
  parseToken,
  parseWhile,
} from '../lang/parser';

import {
  Expression,
  ListExpression,
  PrimitiveExpression,
} from './syntax';

import { Token } from './token-rules';

const ignoreWhitespace = (state: IParserState) => {
  parseWhile(state, state => parseOr(state, [
    state => parseToken(state, Token.WhiteSpaceSpace),
    state => parseToken(state, Token.WhiteSpaceEndline),
    state => parseToken(state, Token.WhiteSpaceOther),
  ]));
};

const ignoreSurroundingWhitespace = <T>(state: IParserState, parser: IParser<T>) => {
  ignoreWhitespace(state);
  const result = parser(state);
  ignoreWhitespace(state);

  return result;
};

const parsePrimitive = (state, tokenType) => {
  const token = parseToken(state, tokenType);

  return new PrimitiveExpression(token.value);
};

export const parseNumberLiteral = state =>
  parsePrimitive(state, Token.Number)
;

export const parseStringLiteral = state =>
  parsePrimitive(state, Token.String)
;

export const parseBooleanLiteral = state =>
  parsePrimitive(state, Token.Boolean)
;

export const parseListLiteral = (state: IParserState) => {
  const expressions = parseList(
    state,
    parseExpression,
    state => ignoreSurroundingWhitespace(state, state => parseToken(state, Token.Symbol, ',')),
    state => ignoreSurroundingWhitespace(state, state => parseToken(state, Token.Symbol, '[')),
    state => ignoreSurroundingWhitespace(state, state => parseToken(state, Token.Symbol, ']')),
  );

  return new ListExpression(expressions);
};

export const parseLiteral = (state: IParserState) => {
  const expression = parseOr(state, [
    state => parseOr(state, [
      parseNumberLiteral,
      parseStringLiteral,
      parseBooleanLiteral,
    ]),
    parseListLiteral,
  ]);

  return expression;
};

export const parseExpression = (state: IParserState) => {
  const expression = ignoreSurroundingWhitespace(state, state => parseOr(state, [
    parseLiteral,
  ]));

  return expression;
};

export const parser = (state: IParserState) => {
  const expr = parseExpression(state);

  parseEOF(state);

  return expr;
};
