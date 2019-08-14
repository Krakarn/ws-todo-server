import { ITables, StateCollection } from '../../lib/server/state';

const getSession = (tablesMap: ITables, sessionId: string) =>
  tablesMap.session.list.find(session => session.id === sessionId)
;

export class TableWithSession<T> extends StateCollection<T> {
  private tablesMap: ITables;

  constructor(name: string, tablesMap: ITables) {
    super(name);

    this.tablesMap = tablesMap;
  }

  public create(createDetails: any) {
    const session = this.getSession(createDetails.sessionId);

    return super.create(createDetails.data);
  }

  public update(updateDetails: any) {
    const session = this.getSession(updateDetails.sessionId);

    return super.update(updateDetails.data);
  }

  public delete(deleteDetails: any) {
    const session = this.getSession(deleteDetails.sessionId);

    return super.delete(deleteDetails.data);
  }

  private getSession(sessionId: string) {
    const session = getSession(this.tablesMap, sessionId);

    if (!session) {
      throw new Error('Session not found.');
    }

    return session;
  }
}
