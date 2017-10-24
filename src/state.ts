import { User } from './state/user';

export interface IStateItem extends IStateItemInternal {
  readonly id: number;
}

export interface IStateItemInternal {
  id?: number;
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

      this.setCurrentId(nextId);
    }

    return this.list.push(item);
  }

  private getNextId(): number {
    return this._currentId + 1;
  }

  private setCurrentId(currentId: number): void {
    this._currentId = currentId;
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
