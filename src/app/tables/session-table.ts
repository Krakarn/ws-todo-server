import { ITables, StateCollection } from '../../lib/server/state';

import { Session } from '../state/session';

export class SessionTable extends StateCollection<Session> {
  private tablesMap: ITables;

  constructor(name: string, tablesMap: ITables) {
    super(name);

    this.tablesMap = tablesMap;
  }

  public create(createDetails: any) {
    const user = this.tablesMap.user.list.find(user =>
      user.name === createDetails.name &&
      user.password === createDetails.password
    );

    if (!user) {
      throw new Error('Username or password did not match.');
    }

    const session = {
      page: createDetails.page || '',
      userId: user.id,
    };

    return super.create(session);
  }
}
