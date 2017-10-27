import { IStateItem } from '../server/state';

export class TodoItem implements IStateItem {
  public readonly id: string;
  public userId: string;

  public name: string;
  public description: string;
  public done: boolean;

  constructor(
    id: string,
    userId: string,
    name: string,
    description = '',
    done = false,
  ) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.done = done;
  }
}
