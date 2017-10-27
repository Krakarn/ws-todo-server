import * as uuid from 'uuid/v4';

import { start } from './server';
import { ITables, State, StateCollection } from './server/state';

import { TodoItem } from './state/todo-item';
import { User } from './state/user';

interface IServerAppTables extends ITables {
  todoItem: StateCollection<TodoItem>;
  user: StateCollection<User>;
}

const tables: IServerAppTables = {
  todoItem: new StateCollection('todoItem'),
  user: new StateCollection('user'),
};

tables.user.create(new User(uuid(), 'admin'));

const state = new State<IServerAppTables, any>(tables);

start(state);
