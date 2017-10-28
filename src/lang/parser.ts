import {
  IObject,
  oMap,
} from '../pure';

import { IToken } from './tokenizer';

export interface IParserState {
  tokens: IToken[];
}

export interface IParserError extends Error {
  state?: IParserState;
  expected?: string;
}

export const error = (state: IParserState, expected: string): IParserError => {
  const error: IParserError = new Error(`Expected ${expected}.`);

  error.state = cloneParserState(state);
  error.expected = expected;

  return error;
};

export interface IParser<T> {
  (state: IParserState): T;
}

export const parseMap = <T, U>(
  parser: IParser<T>,
  mapFn: (result: T, state?) => U
): IParser<U> => state =>
  mapFn(parser(state), state)
;

export const parseSequence = <T>(
  parsers: IParser<T>[]
): IParser<T[]> => state =>
  parsers.reduce((acc, parser) =>
    acc.concat([parser(state)]),
    []
  )
;

const cloneParserState = state => ({
  tokens: state.tokens.slice(),
});

const writeState = (sourceState: IParserState, destinationState: IParserState) => {
  destinationState.tokens = sourceState.tokens.slice();
};

export const tryParse = parser => state => {
  const clonedState = cloneParserState(state);

  try {
    const result = parser(clonedState);

    writeState(clonedState, state);

    return result;

  } catch(e) {
    if (!isParserError(e)) {
      throw e;
    }

    return e;
  }
};

export const parseOr = <T>(parsers: IParser<T>[]): IParser<T> => state => {
  if (parsers.length === 1) {
    return parsers[0](state);
  }

  const errors: IParserError[] = [];

  for (let i=0; i<parsers.length; i++) {
    const parser = parsers[i];
    const result = tryParse(parser)(state);

    if (result instanceof Error) {
      if (!isParserError(result)) {
        throw result;
      }

      errors.push(result);
    } else {
      return result;
    }
  }

  const smallestNumberOfTokens = errors.reduce((acc, error) =>
    acc > error.state.tokens.length ?
      error.state.tokens.length :
      acc
    , errors[0].state.tokens.length
  );

  const _deepestErrors = errors
    .filter(error => error.state.tokens.length === smallestNumberOfTokens)
  ;

  const deepestErrors = [];
  _deepestErrors.forEach(error => {
    if (deepestErrors.every(e => e.expected !== error.expected)) {
      deepestErrors.push(error);
    }
  });

  const deepestState = deepestErrors[0].state;

  let errorString: string;

  if (deepestErrors.length > 1) {
    const lastError = deepestErrors[deepestErrors.length - 1];

    errorString = `${deepestErrors
      .filter((_, i) => i < deepestErrors.length - 1)
      .map(error => error.expected)
      .join(', ')} or ${lastError.expected}`
    ;
  } else {
    errorString = deepestErrors[0].expected;
  }

  throw error(deepestState, errorString);
};

const shiftToken = state => state.tokens.shift();

export const parseToken = (
  tokenName: string,
  tokenValue?: any,
): IParser<IToken> => state => {
  const clonedState = cloneParserState(state);

  const token = shiftToken(clonedState);

  if (
    !token ||
    token.rule.name !== tokenName ||
    (
      tokenValue !== void 0 &&
      token.value !== tokenValue
    )
  ) {
    const expected = (tokenValue === void 0) ?
      tokenName :
      tokenValue.toString()
    ;

    throw error(state, expected);
  }

  writeState(clonedState, state);

  return token;
};

export const parseTokenValue = (
  tokenName: string,
  tokenValue?: string,
) =>
  parseMap(parseToken(tokenName, tokenValue), token => token.value)
;

export const parseEOF = state => {
  if (state.tokens.length > 0) {
    throw error(state, 'EOF');
  }
};

export interface IBinaryOperator<T> {
  precedence: number;
  parseBop: IParser<T>;
  createExpression(lhe: T, rhe: T, bop?: T): T;
}

type BopIntermediate<T> = {bop: IBinaryOperator<T>; bopResult: T};

const binaryListToExpression = <T>(
  list: (T | BopIntermediate<T>)[]
): T => {

  if (list.length === 1) {
    return list[0] as T;
  }

  let lhe: T;
  let bop: BopIntermediate<T>;
  let rhe: T;

  if (list.length === 3) {
    lhe = list[0] as T;
    bop = list[1] as BopIntermediate<T>;
    rhe = list[2] as T;

    return bop.bop.createExpression(lhe, rhe, bop.bopResult);
  }

  const bopList = (list as BopIntermediate<T>[]).filter((_, i) =>
    i % 2 === 1
  );

  const lastPrecedence = bopList.reduce((acc, bop) =>
    bop.bop.precedence > acc ? bop.bop.precedence : acc,
    0
  );

  let i: number;

  for (i = bopList.length - 1; i >= 0; i--) {
    if (bopList[i].bop.precedence === lastPrecedence) {
      break;
    }
  }

  const bopIndex = i * 2 + 1;

  const leftList = list.slice(0, bopIndex);
  const rightList = list.slice(bopIndex + 1);

  lhe = binaryListToExpression(leftList);
  rhe = binaryListToExpression(rightList);

  bop = list[bopIndex] as BopIntermediate<T>;

  return bop.bop.createExpression(lhe, rhe, bop.bopResult);
};

export const parseBinary = <T>(
  binaryOperators: IBinaryOperator<T>[],
  parseExp: IParser<T>
) =>
  parseMap(
    parseList(
      parseExp,
      parseOr(binaryOperators.map(bop =>
        (state: IParserState) => {
          const bopResult = bop.parseBop(state);

          return {bop: bop, bopResult: bopResult};
        }
      )),
      parseNothing,
      parseNothing,
      false,
      true
    ),
    binaryListToExpression,
  )
;

export const parseGroup = <T>(
  parseFn: IParser<T>,
  startParseFn: IParser<void>,
  endParseFn: IParser<void>,
): IParser<T> =>
  parseMap(
    parseSequence<T>([
      startParseFn as any,
      parseFn,
      endParseFn as any,
    ]),
    ([start, middle, end]) => middle,
  )
;

export const parseNothing = <T>(state: IParserState): void => {};

export const parseList = <T, U>(
  parseFn: IParser<T>,
  delimiterParseFn: IParser<U>,
  startParseFn: IParser<void>,
  endParseFn: IParser<void>,
  mayBeEmpty: boolean = true,
  includeDelimitersInList: boolean = false,
): IParser<(T | U)[]> =>
  parseGroup(state => {
    const list: (T | U)[] = [];

    if (mayBeEmpty) {
      const result = tryParse(parseFn)(state);

      if (!(result instanceof Error)) {
        list.push(result as T);

      } else if (!isParserError(result)) {
        throw result;
      }

      if (list.length === 0) {
        return list;
      }
    } else {
      list.push(parseFn(state));
    }

    do {
      const delim = tryParse(delimiterParseFn)(state);

      if (delim instanceof Error) {
        break;
      }

      if (includeDelimitersInList) {
        list.push(delim);
      }

      list.push(parseFn(state));
    } while (true);

    return list;
  }, startParseFn, endParseFn)
;

export const parseWhile = <T>(parser: IParser<T>, mayBeEmpty: boolean = false) => state => {
  const list: T[] = [];

  do {
    const result = tryParse(parser)(state);

    if (result instanceof Error) {
      if (
        !isParserError(result) ||
        (
          !mayBeEmpty &&
          list.length === 0
        )
      ) {
        throw result;
      }

      break;
    }

    list.push(result);

  } while(true);

  return list;
};

const isParserError = (error: Error) => {
  const parserError = error as IParserError;

  return (
    typeof parserError.expected === 'string' &&
    typeof parserError.state === 'object'
  );
};

export const parse = <T>(tokens: IToken[], parser: IParser<T>): T => {
  const state = {
    tokens,
  };

  try {
    return parser(state);

  } catch (e) {
    if (isParserError(e)) {
      const err: IParserError = e;
      const token = e.state.tokens[0];
      const tokenString = token ?
        `${token.rule.name} ${token.value}` :
        'EOF'
      ;
      const errorLocation = token ?
        `[${token.line}:${token.column}] ` :
        ''
      ;

      throw new Error(`${errorLocation}Unexpected ${tokenString} expected ${err.expected}`);
    } else {
      throw e;
    }
  }
};
