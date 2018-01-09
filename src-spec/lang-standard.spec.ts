/*
 * @todo: The expression: if ((1 + 3) == 4) `yes` `no`
 *        does not parse correctly.
 *        Consider adding tests for group wrapping expressions,
 *        as well as longer apply expressions with more than 2 arguments.
 *
 */

import {
  EvaluationState,
} from '../src/lib/lang-standard/evaluation-state';
/*import {
  TypeEvaluationState,
  TypeExpression,
} from '../src/lib/lang/type';*/

import { parserHistoryToString } from '../src/lib/lang/parser';

import {
  INativeLibrary,
  loadLibrary as loadNativeLibrary,
  loadLibraryTypes as loadNativeLibraryTypes,
} from '../src/lib/lang-standard/lib/native';

import {
  stringToExpression
} from '../src/lib/lang-standard/string-to-expression';

import {
  ApplyExpression,
  ApplyInfixExpression,
  IdentifierExpression,
  InfixIdentifierExpression,
  LetExpression,
  PrimitiveExpression,
} from '../src/lib/lang-standard/syntax';
/*import {
  StateIdentifierTypeExpression,
  TypeIdentifierTypeExpression,
} from '../src/lib/lang-standard/type';*/

const stringToEvaluation = (state: any, s: string) =>
  stringToExpression(s).evaluate(state)
;

describe('lang-standard', () => {
  let state: EvaluationState;
  //let typeState: TypeEvaluationState;

  beforeEach(() => {
    state = loadNativeLibrary(new EvaluationState());
    //typeState = loadNativeLibraryTypes(new TypeEvaluationState());
  });

  describe('evaluation-state', () => {
    it('should be able to clone a new state', () => {
      const originalState = state.state;
      const clonedState = state.clone().state;

      expect(originalState).not.toBe(clonedState);
    });

    it('should be able to clone all properties', () => {
      state.state.property = 'value';

      const clone = state.clone();

      expect(clone.state.property).toBe('value');
    });
  });

  describe('syntax-tree', () => {
    let expr: any;

    const testParse = (s: string, it: Function) => {
      describe(s, () => {
        beforeEach(() => {
          try {
            expr = stringToExpression(s);
          } catch(e) {
            if (e.state) {
              const parserHistory = e.state.history;
              const parserHistoryString = parserHistoryToString(parserHistory);

              throw new Error(`${e.message}; State: ${parserHistoryString}`);
            } else {
              throw e;
            }
          }
        });

        it();
      });
    };

    describe('PrimitiveExpression', () => {
      const testParsePrimitive = (
        s: string,
        expected: any,
        //expectedTypeExpression: TypeExpression,
      ) => testParse(s, () => {
        it('should instantiate correctly', () => {
          expect(expr.constructor.name).toBe('PrimitiveExpression');
          expect(expr).toEqual(jasmine.any(PrimitiveExpression));
          expect(expr.value).toBe(expected);
          expect(expr.toString()).toBe(s);
        });

        /*it('should evaluate to the expected type', () => {
          const actualType = expr.evaluateType(typeState);
          const expectedType = expectedTypeExpression.evaluate(typeState);

          expect(actualType).toBe(expectedType);
        });*/

        it('should evaluate to the expected value', () => {
          expect(expr.evaluate(state)).toBe(expected);
        });
      });

      testParsePrimitive('1', 1, /*new TypeIdentifierTypeExpression('number')*/);
      testParsePrimitive('126.2367', 126.2367, /*new TypeIdentifierTypeExpression('number')*/);
      testParsePrimitive('`hello`', 'hello', /*new TypeIdentifierTypeExpression('string')*/);
      testParsePrimitive('true', true, /*new TypeIdentifierTypeExpression('boolean')*/);
      testParsePrimitive('false', false, /*new TypeIdentifierTypeExpression('boolean')*/);
      testParsePrimitive('null', null, /*new TypeIdentifierTypeExpression('null')*/);
    });

    describe('IdentifierExpression', () => {
      const testParseIdentifier = (
        s: string,
      ) => testParse(s, () => {
        describe(s, () => {
          it('should have instantiated correctly', () => {
            expect(expr.constructor.name).toBe('IdentifierExpression');
            expect(expr).toEqual(jasmine.any(IdentifierExpression));
            expect(expr.identifier).toBe(s);
            expect(expr.toString()).toBe(s);
          });

          it('should be able to access state', () => {
            const value = Math.random();
            state.state[s] = value;
            expect(expr.evaluate(state)).toBe(value);
          });

          /*it('should evaluate to the expected type', () => {
            typeState.state[s] = typeState.types['number'];

            const expectedTypeExpression = new TypeIdentifierTypeExpression(
              'number'
            );
            const actualTypeExpression = new StateIdentifierTypeExpression(s);
            const expectedType = expectedTypeExpression.evaluate(typeState);
            const actualType = actualTypeExpression.evaluate(typeState);

            expect(actualType).toBe(expectedType);
          });*/
        });
      });

      [
        'vanilla',
        'underscore',
        '__u_N_d_E_r_S_c_O_r_e__',
        '(+)',
        '(-*+*-)'
      ].map(testParseIdentifier);
    });

    describe('LetExpression', () => {
      const testParseLet = (
        s: string,
        //expectedType: TypeExpression,
      ) => testParse(s, () => {
        it('should instantiate correctly', () => {
          expect(expr.constructor.name).toBe('LetExpression');
          expect(expr).toEqual(jasmine.any(LetExpression));
          expect(expr.toString()).toBe(s);
        });

        /*it('should evaluate to the expected type', () => {
          const expected = expectedType.evaluate(typeState);
          const actual = expr.evaluateType(typeState);

          expect(actual).toBe(expected);
        });*/
      });

      testParseLet(
        'let x = 3 in x', /*new TypeIdentifierTypeExpression('number')*/
      );
      testParseLet(
        'let f = (\\x (any) -> x) in f `hello`', /*new TypeIdentifierTypeExpression('string')*/
      );
    });

    describe('ApplyExpression', () => {
      const testParseApply = (
        s: string,
        argumentTest: Function,
        functionTest: Function,
      ) => testParse(s, () => {

        it('should instantiate correctly', () => {
          expect(expr).toEqual(jasmine.any(ApplyExpression));
          argumentTest(expr.argumentExpression);
          functionTest(expr.functionExpression);
          expect(expr.toString()).toBe(s);
        });
      });

      testParseApply('(+) 2 3', (a: PrimitiveExpression<any, any>) => {
        expect(a.constructor.name).toBe('PrimitiveExpression');
        expect(a).toEqual(jasmine.any(PrimitiveExpression));
        expect(a.value).toBe(3);
      }, (f: ApplyExpression<any, any, any>) => {
        expect(f).toEqual(jasmine.any(ApplyExpression));

        const a = f.argumentExpression as PrimitiveExpression<any, any>;
        expect(a).toEqual(jasmine.any(PrimitiveExpression));
        expect(a.value).toBe(2);

        const i = f.functionExpression as any;
        expect(i).toEqual(jasmine.any(IdentifierExpression));
        expect(i.identifier).toBe('(+)');
      });
    });

    describe('ApplyInfixExpression', () => {
      const testParseApply = (
        s: string,
        argumentTest: Function,
        functionTest: Function,
      ) => testParse(s, () => {

        it('should instantiate correctly', () => {
          expect(expr.constructor.name).toBe('ApplyExpression');
          expect(expr).toEqual(jasmine.any(ApplyExpression));

          argumentTest(expr.argumentExpression);
          functionTest(expr.functionExpression);

          expect(expr.toString()).toBe(s);
        });
      });

      testParseApply('2 + 3', (a: PrimitiveExpression<any, any>) => {
        expect(a.constructor.name).toBe('PrimitiveExpression');
        expect(a).toEqual(jasmine.any(PrimitiveExpression));
        expect(a.value).toBe(3);
      }, (f: ApplyInfixExpression<any, any, any>) => {
        expect(f.constructor.name).toBe('ApplyInfixExpression');
        expect(f).toEqual(jasmine.any(ApplyInfixExpression));

        const a = f.argumentExpression as PrimitiveExpression<any, any>;
        expect(a.constructor.name).toBe('PrimitiveExpression');
        expect(a).toEqual(jasmine.any(PrimitiveExpression));
        expect(a.value).toBe(2);

        const i = f.functionExpression as any;
        expect(i.constructor.name).toBe('InfixIdentifierExpression');
        expect(i).toEqual(jasmine.any(InfixIdentifierExpression));
        expect(i.identifier).toBe('+');
      });
    });

    describe('GroupExpression', () => {
      const expr = stringToExpression('(1 + 3 == 4)');
    });

  });

  describe('lib-native', () => {
    const testEvaluate = (s: string, map: (e: any) => void) => {
      it(`should be able to evaluate ${s}`, () => {
        map(stringToEvaluation(state, s));
      });
    };

    describe('state', () => {
      it('should define native functions', () => {
        expect(typeof state.state['(+)']).toBe('function');
        expect(typeof state.state['(-)']).toBe('function');
        expect(typeof state.state['(*)']).toBe('function');
        expect(typeof state.state['(/)']).toBe('function');
      });
    });

    describe('(+)', () => {
      it('should evaluate to a function', () => {
        const expr = stringToExpression('(+)');
        const value = expr.evaluate(state);

        expect(typeof value).toBe('function');
      });

      const x = 44.13;
      const y = 85.432;
      const sum = x + y;

      testEvaluate(`(+) ${x} ${y}`, e => expect(e).toBe(sum));
    });
  });
});
