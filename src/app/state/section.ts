import { IStateItem } from '../../lib/server/state';

export class Section implements IStateItem {
  public readonly id: string;

  public name: string;
  public table: string;
  public all: boolean;

  constructor(
    id: string,
    name: string,
    table: string,
    all: boolean = false,
  ) {
    this.id = id;
    this.name = name;
    this.table = table;
    this.all = all;
  }
}
