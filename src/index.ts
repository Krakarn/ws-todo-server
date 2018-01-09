import * as Rx from 'rxjs';
import * as uuid from 'uuid/v4';

import { server } from './lib/server/server';
import { ITables, State, StateCollection } from './lib/server/state';

import { Task } from './app/state/task';
import { User } from './app/state/user';

interface IServerAppTables extends ITables {
  task: StateCollection<Task>;
  user: StateCollection<User>;
}

const tablesMap: IServerAppTables = {
  task: new StateCollection('task'),
  user: new StateCollection('user'),
};

const tables = Object.keys(tablesMap).map(k => tablesMap[k]);

tablesMap.user.create(new User(uuid(), 'admin'));

const state = new State<IServerAppTables, any>(tablesMap);

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
  .do(e => console.log('Table event: ', e))
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
