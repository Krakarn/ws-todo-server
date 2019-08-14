import { IStateItem } from '../../lib/server/state';

export class Session implements IStateItem {
  public readonly id: string;

  public page: string;

  public userId: string;

  constructor(
    id: string,
    page: string,
    userId: string,
  ) {
    this.id = id;
    this.page = page;
    this.userId = userId;
  }
}
