import { IStateItem } from '../../lib/server/state';

export class UserUserGroup implements IStateItem {
  public readonly id: string;

  public userId: string;
  public userGroupId: string;

  constructor(
    id: string,
    userId: string,
    userGroupId: string,
  ) {
    this.id = id;
    this.userId = userId;
    this.userGroupId = userGroupId;
  }
}
