export class TodoItem {
  public name: string;
  public description: string;
  public done: boolean;

  constructor(
    name: string,
    description = '',
    done = false
  ) {
    this.name = name;
    this.description = description;
    this.done = done;
  }
}
