import { TodoItem } from './todo-item';

export class TodoList {
  public todos: TodoItem[];

  constructor(
    todos: TodoItem[] = []
  ) {
    this.todos = todos.slice();
  }
}
