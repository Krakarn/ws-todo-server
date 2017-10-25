import { start } from './server';
import { State } from './server/state';

const state = new State<any>();

start(state);
