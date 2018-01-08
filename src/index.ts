import * as Rx from 'rxjs';
import * as uuid from 'uuid/v4';

import { server } from './server';
import { ITables, State, StateCollection } from './server/state';

import { TodoItem } from './state/todo-item';
import { User } from './state/user';

interface IServerAppTables extends ITables {
  todoItem: StateCollection<TodoItem>;
  user: StateCollection<User>;
}

const tablesMap: IServerAppTables = {
  todoItem: new StateCollection('todoItem'),
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
