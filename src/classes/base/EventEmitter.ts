// src/base/EventEmitter.ts

type EventName = string | RegExp; // Тип для имени события: строка или регулярное выражение
type Callback = (...args: any[]) => void; // Тип для функции обратного вызова события


interface IEventEmitter {
    on<T extends object>(event: EventName, callback: (args: T) => void): void;
    off<T extends object>(event: EventName, callback: (args: T) => void): void;
    emit<T extends object>(event: string, args?: T): void;
    trigger<T extends object>(eventName: string, args?: T): void;
}

export class EventEmitter implements IEventEmitter {
    // Внутреннее хранилище для обработчиков событий
    _events: Map<EventName, Set<Callback>>;

    constructor() {
        this._events = new Map<EventName, Set<Callback>>();
    }

    on<T extends object>(event: EventName, callback: (args: T) => void): void {
        if (!this._events.has(event)) {
            this._events.set(event, new Set<Callback>());
        }
        this._events.get(event)?.add(callback as Callback);
    }

    off<T extends object>(event: EventName, callback: (args: T) => void): void {
        if (this._events.has(event)) {
            this._events.get(event)?.delete(callback as Callback);
        }
    }

    emit<T extends object>(event: string, args?: T): void {
        // Вызываем обработчики, подписанные на точное имя события
        this._events.get(event)?.forEach(callback => callback(args));

        // Вызываем обработчики, подписанные с помощью регулярных выражений
        this._events.forEach((callbacks, name) => {
            if (name instanceof RegExp && name.test(event)) {
                callbacks.forEach(callback => callback(args));
            }
        });
    }

    trigger<T extends object>(eventName: string, args?: T): void {
        this.emit(eventName, args);
    }
}