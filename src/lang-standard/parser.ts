import {
  constant,
  oMap,
} from '../pure';

import { IEvaluationState } from '../lang/evaluation-state';
import {
  addHistory,
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
  addHistory('group',
    parseMap(
      parseGroup<Expression<any, any>>(
        parseExpression(),
        ignoreSurroundingWhitespace(parseToken(Token.Symbol, '(')),
        ignoreSurroundingWhitespace(parseToken(Token.Symbol, ')')),
      ),
      expression => new GroupExpression(expression),
    )
  )
;

const parsePrimitive = tokenType =>
  parseMap(
    parseToken(tokenType),
    token => new PrimitiveExpression(token.value)
  )
;

const parseNumberLiteral =
  parseMap(
    parsePrimitive(Token.Number),
    (primitive, state) => {
      addHistory(`number ${primitive.toString()}`)(state);

      return primitive;
    }
  )
;

const parseStringLiteral =
  parseMap(
    parsePrimitive(Token.String),
    (primitive, state) => {
      addHistory(`string ${primitive.toString()}`)(state);

      return primitive;
    }
  )
;

const parseKeywordLiteral =
  parseMap(
    parseOr([
      parseMap(parseToken(Token.Identifier, 'true'), constant(true)),
      parseMap(parseToken(Token.Identifier, 'false'), constant(false)),
      parseMap(parseToken(Token.Identifier, 'null'), constant(null)),
    ]),
    (value, state) => {
      addHistory(`keyword ${value}`)(state);

      return new PrimitiveExpression(value);
    }
  )
;

const parseListLiteral =
  addHistory('list',
    parseMap(
      parseList<Expression<any, any>, any>(
        parseExpression(),
        ignoreSurroundingWhitespace(parseToken(Token.Symbol, ',')),
        ignoreSurroundingWhitespace(parseToken(Token.Symbol, '[')),
        ignoreSurroundingWhitespace(parseToken(Token.Symbol, ']')),
      ),
      expressions => new ListExpression(expressions)
    )
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

const symbolIdentifierTest = /[\%\+\-\*\/\.\,\=\<\>\&\|\$\^\!\?]+/;

const parsePrefixSymbol =
  parseMap(
    parseSymbol,
    (identifier, state) => {
      if(
        identifier[0] === '(' &&
        identifier[identifier.length - 1] === ')' &&
        symbolIdentifierTest.test(identifier.slice(1, -1))
      ) {
        return identifier;
      }

      throw error(state, 'identifier');
    }
  )
;

const parseInfixSymbol =
  parseMap(
    parseSymbol,
    (identifier, state) => {
      if (symbolIdentifierTest.test(identifier)) {
        return identifier;
      }

      throw error(state, 'identifier-infix');
    }
  )
;

const parseInfixIdentifier =
  parseMap(
    parseInfixSymbol,
    (identifier, state) => {
      addHistory(`identifier-infix ${identifier}`)(state);

      return new InfixIdentifierExpression(identifier);
    }
  )
;

const parsePrefixIdentifier =
  parseMap(
    parseOr([
      parseTokenValue(Token.Identifier),
      parsePrefixSymbol,
    ]),
    (value, state) => {
      addHistory(`identifier-prefix ${value}`)(state);

      return new IdentifierExpression(value);
    }
  )
;

const parseLet =
  addHistory('let',
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
  )
;

const parseFunction =
  addHistory('function',
    parseMap(
      parseSequence<any>(
        [
          parseToken(Token.Symbol, '\\'),
          parseTokenValue(Token.Identifier),
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
  )
;

const parseInfixApply = state =>
  addHistory('apply-infix',
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
    )
  )(state)
;

const parseApply = state =>
  addHistory('apply',
    parseMap(
      parseSequence([
        parseExpression([parseApply, parseInfixApply]),
        parseWhile(
          parseExpression([parseApply, parseInfixApply]),
        ),
      ]),
      ([f, es]) => es.reduce((acc, e) =>
        new ApplyExpression(
          acc,
          e,
        ),
        f
      )
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
