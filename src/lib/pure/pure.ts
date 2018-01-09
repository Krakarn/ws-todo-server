export interface IObject<T> {
  [index:string]: T;
}

export const oForEach = <T>(
  f: (t: T, k: string) => void,
  o: IObject<T>,
): void => {
  for (const k in o) {
    if (o.hasOwnProperty(k)) {
      f(o[k], k);
    }
  }
};

export const oMap = <T, U>(
  f: (t: T, k: string) => U,
  o: IObject<T>,
): IObject<U> => {
  const ou = {};

  oForEach((t, k) => ou[k] = f(t as T, k), o);

  return ou;
};

export const constant = <T>(value: T) => () => value;
