import { IStateItem } from '../../lib/server/state';

export class UserGroup implements IStateItem {
  public readonly id: string;

  public name: string;

  constructor(
    id: string,
    name: string,
  ) {
    this.id = id;
    this.name = name;
  }
}
