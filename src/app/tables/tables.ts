import { ITables, StateCollection } from '../../lib/server/state';

import { SessionTable } from './session-table';
import { TableWithSession } from './table-with-session';

import { Permission } from '../state/permission';
import { Section } from '../state/section';
import { SectionEntry } from '../state/section-entry';
import { Session } from '../state/session';
import { Task } from '../state/task';
import { User } from '../state/user';
import { UserGroup } from '../state/user-group';
import { UserUserGroup } from '../state/user-user-group';

export interface IServerAppTables extends ITables {
  permission: StateCollection<Permission>;
  section: StateCollection<Section>;
  sectionEntry: StateCollection<SectionEntry>;
  session: StateCollection<Session>;
  task: StateCollection<Task>;
  user: StateCollection<User>;
  userGroup: StateCollection<UserGroup>;
  userUserGroup: StateCollection<UserUserGroup>;
}

export const tablesMap: Partial<IServerAppTables> = {};

tablesMap.permission = new StateCollection('permission');
tablesMap.session = new SessionTable('session', tablesMap);

tablesMap.section = new TableWithSession<Section>('section', tablesMap);
tablesMap.sectionEntry = new TableWithSession<SectionEntry>('sectionEntry', tablesMap);
tablesMap.task = new TableWithSession<Task>('task', tablesMap);
tablesMap.user = new TableWithSession<User>('user', tablesMap);
tablesMap.userGroup = new TableWithSession<UserGroup>('userGroup', tablesMap);
tablesMap.userUserGroup = new TableWithSession<UserUserGroup>('userUserGroup', tablesMap);

export const tables = Object.keys(tablesMap).map(k => tablesMap[k]);
