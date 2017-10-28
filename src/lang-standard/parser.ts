import {
  constant,
  oMap,
} from '../pure';

import { IEvaluationState } from '../lang/evaluation-state';
import {
  error,
  IParser,
  IParserState,
  parseEOF,
  parseGroup,
  parseList,
  parseMap,
  parseNothing,
  parseOr,
  parseSequence,
  parseToken,
  parseWhile,
} from '../lang/parser';
import { IToken } from '../lang/tokenizer';

import {
  ApplyExpression,
  Expression,
  FunctionExpression,
  GroupExpression,
  IdentifierExpression,
  LetExpression,
  ListExpression,
  PrimitiveExpression,
} from './syntax';

import { Token } from './token-rules';

const ignoreWhitespace =
  parseWhile(
    parseOr([
      parseToken(Token.WhiteSpaceSpace),
      parseToken(Token.WhiteSpaceEndline),
      parseToken(Token.WhiteSpaceOther),
    ])
  )
;

const ignoreSurroundingWhitespace = <T>(parser: IParser<T>): IParser<T> =>
  parseMap(
    parseSequence<T>([
      ignoreWhitespace as any,
      parser,
      ignoreWhitespace as any,
    ]),
    ([wsl, result, wsr]) => result,
  )
;

export const parseExpression = (
  parsersNotAllowed: IParser<any>[] = [],
) => state =>
  ignoreSurroundingWhitespace(
    parseOr([
      parseGroupWrapper,
      parseLiteral,
      parseLet,
      parseFunction,
      parseApply,
      parseIdentifier,
    ].filter(parser => parsersNotAllowed.every(
      parserNotAllowed => parserNotAllowed !== parser
    )))
  )(state)
;

export const parseGroupWrapper =
  parseMap(
    parseGroup<Expression<any, any>>(
      parseExpression(),
      ignoreSurroundingWhitespace(parseToken(Token.Symbol, '(')),
      ignoreSurroundingWhitespace(parseToken(Token.Symbol, ')')),
    ),
    expression => new GroupExpression(expression),
  )
;

const parsePrimitive = tokenType =>
  parseMap(
    parseToken(tokenType),
    token => new PrimitiveExpression(token.value)
  )
;

export const parseNumberLiteral = parsePrimitive(Token.Number);
export const parseStringLiteral = parsePrimitive(Token.String);

export const parseKeywordLiteral =
  parseMap(
    parseOr([
      parseMap(parseToken(Token.Identifier, 'true'), constant(true)),
      parseMap(parseToken(Token.Identifier, 'false'), constant(false)),
      parseMap(parseToken(Token.Identifier, 'null'), constant(null)),
    ]),
    value => new PrimitiveExpression(value),
  )
;

export const parseListLiteral =
  parseMap(
    parseList<Expression<any, any>, any>(
      parseExpression(),
      ignoreSurroundingWhitespace(parseToken(Token.Symbol, ',')),
      ignoreSurroundingWhitespace(parseToken(Token.Symbol, '[')),
      ignoreSurroundingWhitespace(parseToken(Token.Symbol, ']')),
    ),
    expressions => new ListExpression(expressions)
  )
;

export const parseLiteral =
  parseOr<any>([
    parseNumberLiteral,
    parseStringLiteral,
    parseKeywordLiteral,
    parseListLiteral,
  ])
;

export const parseIdentifier =
  parseMap(
    parseOr([
      parseMap(parseToken(Token.Identifier), token => token.value),
      parseMap(
        parseWhile(parseToken(Token.Symbol)),
        (tokens, state) => {
          const value = tokens.map(t => t.value).join('');

          if (/\([\+\-\*\/]\)/.test(value)) {
            return value;
          }

          throw error(state, 'identifier');
        }
      ),
    ]),
    value => new IdentifierExpression(value),
  )
;

export const parseLet =
  parseMap(
    parseSequence<any>(
      [
        parseToken(Token.Identifier, 'let'),
        parseMap(
          parseToken(Token.Identifier),
          token => token.value,
        ),
        parseToken(Token.Symbol, '='),
        parseExpression(),
        parseToken(Token.Identifier, 'in'),
        parseExpression(),
      ].map(ignoreSurroundingWhitespace)
    ),
    result => new LetExpression(
      result[3],
      new FunctionExpression(
        result[1],
        result[5],
      )
    ),
  )
;

export const parseFunction =
  parseMap(
    parseSequence<any>(
      [
        parseToken(Token.Symbol, '\\'),
        parseMap(
          parseToken(Token.Identifier),
          token => token.value,
        ),
        parseSequence([
          parseToken(Token.Symbol, '-'),
          parseToken(Token.Symbol, '>'),
        ]),
        parseExpression(),
      ].map(ignoreSurroundingWhitespace)
    ),
    result => new FunctionExpression(
      result[1],
      result[3],
    )
  )
;

export const parseApply = state =>
  parseMap(
    parseWhile(
      parseExpression([parseApply]),
    ),
    list => list.slice(1).reduce((acc, expression) =>
      new ApplyExpression(
        acc,
        expression,
      ),
      list[0]
    )
  )(state)
;

export const parser =
  parseMap(
    parseSequence([
      parseExpression(),
      parseEOF
    ]),
    ([expr, eof]) => expr
  )
;
