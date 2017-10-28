/*
 * @todo: The expression: if ((1 + 3) == 4) `yes` `no`
 *        does not parse correctly.
 *        Consider adding tests for group wrapping expressions,
 *        as well as longer apply expressions with more than 2 arguments.
 *
 */

import {
  EvaluationState
} from '../src/lang-standard/evaluation-state';

import {
  INativeLibrary,
  loadLibrary as loadNativeLibrary
} from '../src/lang-standard/lib/native';

import {
  stringToExpression
} from '../src/lang-standard/string-to-expression';

import {
  ApplyExpression,
  ApplyInfixExpression,
  IdentifierExpression,
  InfixIdentifierExpression,
  PrimitiveExpression,
} from '../src/lang-standard/syntax';

const stringToEvaluation = (state: any, s: string) =>
  stringToExpression(s).evaluate(state)
;

describe('lang-standard', () => {
  let state: EvaluationState;

  beforeEach(() => {
    state = new EvaluationState();
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
        beforeEach(() => expr = stringToExpression(s));

        it();
      });
    };

    describe('PrimitiveExpression', () => {
      const testParsePrimitive = (
        s: string,
        expected: any,
      ) => testParse(s, () => {
        it('should instantiate correctly', () => {
          expect(expr.constructor.name).toBe('PrimitiveExpression');
          expect(expr).toEqual(jasmine.any(PrimitiveExpression));
          expect(expr.value).toBe(expected);
          expect(expr.toString()).toBe(s);
        });

        it('should evaluate to the expected value', () => {
          expect(expr.evaluate(state)).toBe(expected);
        });
      });

      testParsePrimitive('1', 1);
      testParsePrimitive('126.2367', 126.2367);
      testParsePrimitive('`hello`', 'hello');
      testParsePrimitive('true', true);
      testParsePrimitive('false', false);
      testParsePrimitive('null', null);
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

        const i = f.functionExpression as IdentifierExpression<any, any>;
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

        const i = f.functionExpression as InfixIdentifierExpression<any, any>;
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
    beforeEach(() => {
      state = loadNativeLibrary(state);
    });

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
