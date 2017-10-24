import { IStateItem } from '../state';
import { TodoList } from './todo-list';

export class User implements IStateItem {
  public readonly id: number;
  public todoList: TodoList;

  constructor(
    todoList = new TodoList(),
  ) {
    this.todoList = todoList;
  }
}
