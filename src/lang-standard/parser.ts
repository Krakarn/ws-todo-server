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
  parseTokenValue,
  parseWhile,
} from '../lang/parser';
import { IToken } from '../lang/tokenizer';

import {
  ApplyExpression,
  ApplyInfixExpression,
  Expression,
  FunctionExpression,
  GroupExpression,
  IdentifierExpression,
  InfixIdentifierExpression,
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
    ]),
    true
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

const parseExpression = (
  parsersNotAllowed: IParser<any>[] = [],
) => state =>
  ignoreSurroundingWhitespace(
    parseOr([
      parseGroupWrapper,
      parseApply,
      parseInfixApply,
      parseLiteral,
      parseLet,
      parseFunction,
      parsePrefixIdentifier,
    ].filter(parser => parsersNotAllowed.every(
      parserNotAllowed => parserNotAllowed !== parser
    )))
  )(state)
;

const parseGroupWrapper =
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

const parseNumberLiteral = parsePrimitive(Token.Number);
const parseStringLiteral = parsePrimitive(Token.String);

const parseKeywordLiteral =
  parseMap(
    parseOr([
      parseMap(parseToken(Token.Identifier, 'true'), constant(true)),
      parseMap(parseToken(Token.Identifier, 'false'), constant(false)),
      parseMap(parseToken(Token.Identifier, 'null'), constant(null)),
    ]),
    value => new PrimitiveExpression(value),
  )
;

const parseListLiteral =
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

const parseLiteral =
  parseOr<any>([
    parseNumberLiteral,
    parseStringLiteral,
    parseKeywordLiteral,
    parseListLiteral,
  ])
;

const parseSymbol =
  parseMap(
    parseWhile(parseTokenValue(Token.Symbol)),
    values => values.join('')
  )
;

const parsePrefixSymbol =
  parseMap(
    parseSymbol,
    (identifier, state) => {
      if(/\([\+\-\*\/\.\,\=\<\>\$\^\!\?]+\)/.test(identifier)) {
        return identifier;
      }

      throw error(state, 'identifier');
    }
  )
;

const parseInfixIdentifier =
  parseMap(
    parseSymbol,
    value => new InfixIdentifierExpression(value)
  )
;

const parsePrefixIdentifier =
  parseMap(
    parseOr([
      parseTokenValue(Token.Identifier),
      parsePrefixSymbol,
    ]),
    value => new IdentifierExpression(value),
  )
;

const parseLet =
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

const parseFunction =
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

const parseInfixApply = state =>
  parseMap(
    parseSequence([
      parseExpression([parseInfixApply]),
      ignoreWhitespace,
      parseInfixIdentifier,
      ignoreWhitespace,
      parseExpression(),
    ]),
    ([lhe, lws, infixFunction, rws, rhe]) =>
      new ApplyExpression(
        new ApplyInfixExpression(
          infixFunction,
          lhe,
        ),
        rhe,
      )
  )(state)
;

const parseApply = state =>
  parseMap(
    parseWhile(
      parseExpression([parseApply, parseInfixApply]),
    ),
    expressions => expressions.slice(1).reduce((acc, expression) =>
      new ApplyExpression(
        acc,
        expression,
      ),
      expressions[0]
    )
  )(state)
;

export const parser: IParser<Expression<any,any>> =
  parseMap<any, any>(
    parseSequence([
      parseExpression(),
      parseEOF
    ]),
    ([expr, eof]) => expr
  )
;
