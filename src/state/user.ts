import { IStateItem } from '../server/state';

import { TodoItem } from './todo-item';

export class User implements IStateItem {
  public readonly id: string;

  public name: string;

  public todos: TodoItem[];

  constructor(
    id: string,
    name: string,
    todos: TodoItem[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.todos = todos;
  }
}
