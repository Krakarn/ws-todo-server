import * as uuid from 'uuid/v4';

export interface IStateItem extends IStateItemInternal {
  readonly id: string;
}

export interface IStateItemInternal {
  id?: string;
}

export class StateCollection<T extends IStateItemInternal> {
  public list: T[];

  private _currentId: number;

  constructor(
    list: T[] = []
  ) {
    list.forEach(this.add.bind(this));

    this._currentId = 0;
  }

  public add(item: T) {
    if (!item.id) {
      const nextId = this.getNextId();
      item.id = nextId;
    }

    return this.list.push(item);
  }

  private getNextId(): string {
    return uuid();
  }
}

export interface ITables {
  [key:string]: StateCollection<any>;
}

export class State<T extends ITables> {
  public tables: T;

  constructor(
    tables: {[key:string]: any[]} = {},
  ) {
    this.tables = {} as T;

    for (const k in tables) {
      if (tables.hasOwnProperty(k)) {
        this.tables[k] = new StateCollection(tables[k]);
      }
    }
  }
}
