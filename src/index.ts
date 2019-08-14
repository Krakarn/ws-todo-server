import * as Rx from 'rxjs';
import * as uuid from 'uuid/v4';

import { server } from './lib/server/server';
import { ITables, State, StateCollection } from './lib/server/state';

import { SessionTable } from './app/tables/session-table';
import { TableWithSession } from './app/tables/table-with-session';

import { IServerAppTables, tables, tablesMap } from './app/tables/tables';

import { Section } from './app/state/section';
import { User } from './app/state/user';

tablesMap.user.list.push(new User(uuid(), 'admin', '1234'));

tablesMap.section.list.push(new Section(uuid(), 'All Sessions', 'session', true));
tablesMap.section.list.push(new Section(uuid(), 'All Tasks', 'task', true));
tablesMap.section.list.push(new Section(uuid(), 'All Users', 'user', true));

const state = new State<IServerAppTables, any>(tablesMap as IServerAppTables);

const server$ = server(state);

const events$ = Rx.Observable
  .merge.apply(
    Rx.Observable,
    tables.map(
      table => table.events$.map(
        event => ({table: table, event: event})
      )
    ),
  )
;

const printEvents$ = events$
  .do(e => console.log('Table event:', e))
;

const sideEffects$ = Rx.Observable
  .merge(
    server$,
    printEvents$,
  )
;

sideEffects$.subscribe(
  () => {},
  error => { console.error(error); },
  () => { console.log('Server completed.'); },
);
