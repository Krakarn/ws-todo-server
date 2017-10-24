import { start } from './server';
import { State } from './state';

const state = new State<any>();

start(state);
