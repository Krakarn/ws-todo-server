import { IStateItem } from '../server/state';
import { TodoList } from './todo-list';

export class User implements IStateItem {
  public readonly id: string;
  public todoList: TodoList;

  constructor(
    todoList = new TodoList(),
  ) {
    this.todoList = todoList;
  }
}
