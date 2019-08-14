import { IStateItem } from '../../lib/server/state';

export class Permission implements IStateItem {
  public readonly id: string;

  public userGroupId: string;
  public permittedSectionId: string;

  constructor(
    id: string,
    userGroupId: string,
    permittedSectionId: string,
  ) {
    this.id = id;
    this.userGroupId = userGroupId;
    this.permittedSectionId = permittedSectionId;
  }
}
