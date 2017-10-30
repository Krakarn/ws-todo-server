import * as uuid from 'uuid/v4';

import * as Rx from 'rxjs';

import { oForEach } from '../pure';

import { EvaluationState } from '../lang-standard/evaluation-state';
import {
  INativeLibrary,
  loadLibrary as loadNativeLibrary,
  loadLibraryTypes as loadNativeLibraryTypes,
} from '../lang-standard/lib/native';
import { IEvaluationState } from '../lang/evaluation-state';
import { Expression } from '../lang/syntax';
import {
  ITypeEvaluationState,
  TypeEvaluationState,
} from '../lang/type';

import { IClient } from './client';
import {
  IServerErrorMessage,
  ServerMessageType
} from './server-message';
import { ISubscription } from './subscription';

export interface IStateItem extends IStateItemInternal {
  readonly id: string;
}

export interface IStateItemInternal {
  id?: string;
}

export interface IStateCollectionEvent {
  type: 'create' | 'delete' | 'update' | 'list';
}

export interface IStateCollectionListEvent<T> extends IStateCollectionEvent {
  type: 'list';
  table: string;
  list: T[];
}

export interface IStateCollectionItemEvent<T> extends IStateCollectionEvent {
  type: 'create' | 'delete' | 'update';
  item: T;
}

export interface IStateCollectionCreateEvent<T> extends IStateCollectionItemEvent<T> {
  type: 'create';
}

export interface IStateCollectionUpdateEvent<T> extends IStateCollectionItemEvent<T> {
  type: 'update';
}

export interface IStateCollectionDeleteEvent<T> extends IStateCollectionItemEvent<T> {
  type: 'delete';
}

export const evaluationStateItemIdentifier = '__item';

export class StateCollection<T extends IStateItemInternal> {
  public name: string;
  public list: T[];

  public readonly events$: Rx.Observable<IStateCollectionEvent>;

  private events$pushSubject: Rx.Subject<IStateCollectionEvent>;
  private events$pullSubject: Rx.Subject<IStateCollectionEvent>;

  constructor(
    name: string,
    list: T[] = [],
  ) {
    this.name = name;
    this.list = [];
    list.forEach(this.create.bind(this));

    this.events$pushSubject = new Rx.Subject();
    this.events$ = this.events$pushSubject
      .asObservable()
    ;
    this.events$pullSubject = new Rx.Subject();
    this.events$.subscribe(this.events$pullSubject);
  }

  public create(item: T) {
    if (!item.id) {
      const nextId = this.getNextId();
      item.id = nextId;
    }

    this.list.push(item);

    this.events$pushSubject.next({
      type: 'create',
      table: this.name,
      item: item,
    } as IStateCollectionCreateEvent<T>);
  }

  public delete(id: string) {
    let index: number;

    const item = this.list.find((item, i) => {
      index = i;

      return item.id === id;
    });

    if (item) {
      this.list.splice(index, 1);

      this.events$pushSubject.next({
        type: 'delete',
        table: this.name,
        item: item,
      } as IStateCollectionDeleteEvent<T>);
    }
  }

  public update(item: T) {
    const tableItem = this.list.find(i => item.id === i.id);

    oForEach((p, k) => tableItem[k] = p, item as any);

    this.events$pushSubject.next({
      type: 'update',
      table: this.name,
      item: item,
    } as IStateCollectionUpdateEvent<T>);
  }

  private getNextId(): string {
    return uuid();
  }
}

export interface ITables {
  [key:string]: StateCollection<any>;
}

interface IClientInfo<T extends IEvaluationState> {
  client: IClient;
  rxSubscriptions: {[subscriptionId:string]: Rx.Subscription};
  subscriptions: ISubscription<T>[];
}

export class State<T extends ITables, U extends IEvaluationState> {
  public tables: T;

  public clients: {[clientId: string]: IClientInfo<U>};

  public readonly evaluationState: EvaluationState &
    INativeLibrary<any>;
  public readonly typeEvaluationState: ITypeEvaluationState;

  constructor(
    tables: T = {} as T,
  ) {
    this.tables = tables;
    this.clients = {};

    this.evaluationState = this.createEvaluationState();
    this.typeEvaluationState = this.createTypeEvaluationState();
  }

  public registerClient(client: IClient) {
    if (this.clients[client.id]) {
      throw new Error(`Client ${client.id} is already registered.`);
    }

    this.clients[client.id] = {
      client,
      rxSubscriptions: {},
      subscriptions: [],
    };
  }

  public deregisterClient(clientId: string) {
    const clientInfo = this.clients[clientId];

    if (!clientInfo) {
      throw new Error(`Client ${clientId} not registered.`);
    }

    clientInfo.subscriptions.forEach(subscription => {
      this.unsubscribe(clientInfo.client.id, subscription.id);
    });

    clientInfo.subscriptions = [];
  }

  public subscribe(
    clientId: string,
    table: string,
    filter?: Expression<U, boolean>,
  ): ISubscription<U> {
    const clientInfo = this.clients[clientId];

    if (!this.tables[table]) {
      throw new Error(`Subscribe failed: Table ${table} not found.`);
    }

    const subscription: ISubscription<U> = {
      id: uuid(),
      table,
      filter,
    };

    clientInfo.subscriptions.push(subscription);

    let rx = this.tables[table]
      .events$
    ;

    if (filter) {

      rx = rx
        .filter(event => {
          if (
            event.type === 'create' ||
            event.type === 'update' ||
            event.type === 'delete'
          ) {
            const eState = this.evaluationState.clone<U>();
            eState[evaluationStateItemIdentifier] = event;

            return filter.evaluate(eState);
          }
        })
      ;
    }

    clientInfo.rxSubscriptions[subscription.id] =
      rx.subscribe(
        this.sendSubscriptionEvent.bind(this, clientInfo.client),
        this.sendError.bind(this, clientInfo.client),
      )
    ;

    const list = this.tables[table].list.filter(item => {
      if (filter) {
        const eState = this.evaluationState.clone<U>();
        eState[evaluationStateItemIdentifier] = item;

        return filter.evaluate(eState);
      }

      return true;
    });

    this.sendSubscriptionEvent(clientInfo.client, {
      type: 'list',
      table: table,
      list,
    } as IStateCollectionListEvent<any>);

    return subscription;
  }

  public unsubscribe(clientId: string, subscriptionId: string): ISubscription<U> {
    const clientInfo = this.clients[clientId];

    const subscription = clientInfo.subscriptions.find(s =>
      s.id === subscriptionId
    );

    clientInfo.subscriptions = clientInfo.subscriptions.filter(s =>
      s.id !== subscriptionId
    );

    clientInfo.rxSubscriptions[subscription.id].unsubscribe();
    clientInfo.rxSubscriptions[subscription.id] = void 0;
    delete clientInfo.rxSubscriptions[subscription.id];

    return subscription;
  }

  private sendSubscriptionEvent<V>(
    client: IClient,
    event: V,
  ) {
    client.socket.send(JSON.stringify(event));
  }

  private sendError(client: IClient, error: any) {
    client.socket.send(JSON.stringify({
      type: ServerMessageType.Error,
      error: error,
    } as IServerErrorMessage));
  }

  private createEvaluationState() {
    const eState = new EvaluationState();

    return loadNativeLibrary(eState);
  }

  private createTypeEvaluationState() {
    const eState: ITypeEvaluationState = new TypeEvaluationState();

    return loadNativeLibraryTypes(eState);
  }
}
