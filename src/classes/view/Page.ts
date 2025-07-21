// src/classes/view/Page.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';

interface IPage {
    counter: number;
    catalog: HTMLElement[];
    locked: boolean; // Добавил в интерфейс, чтобы render мог его принимать
}

export class Page extends Component<IPage> {
    protected _counter: HTMLElement;
    protected _catalog: HTMLElement;
    protected _basket: HTMLButtonElement;
    protected _wrapper: HTMLElement; // Объявление поля

    constructor(container: HTMLElement | HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // document.body

        this._counter = this._element.querySelector('.header__basket-counter')!;
        this._catalog = this._element.querySelector('.gallery')!;
        this._basket = this._element.querySelector('.header__basket')!;
        this._wrapper = this._element.querySelector('.page__wrapper')!; // Инициализация _wrapper

        this._basket.addEventListener('click', () => {
            this.events.emit('basket:open');
        });
    }

    set counter(value: number) {
        this.setText(this._counter, String(value));
    }

    set catalog(items: HTMLElement[]) {
        if (this._catalog) {
            this._catalog.replaceChildren(...items);
        }
    }

    set locked(value: boolean) {
        if (this._wrapper) { // Проверка на существование _wrapper перед использованием
            this.toggleClass(this._wrapper, 'page__wrapper_locked', value);
        }
    }

    render(data?: Partial<IPage>): HTMLElement { // Изменил на Partial, так как не все поля могут быть в data
        if (data?.counter !== undefined) {
            this.counter = data.counter;
        }
        if (data?.catalog) {
            this.catalog = data.catalog;
        }
        if (data?.locked !== undefined) {
            this.locked = data.locked;
        }
        return this._element;
    }
}