// src/classes/view/BasketView.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';

interface IBasketView {
    items: HTMLElement[];
    total: number;
    buttonText?: string;
    buttonDisabled?: boolean;
}

export class BasketView extends Component<IBasketView> {
    protected _list: HTMLElement;
    protected _total: HTMLElement;
    protected _button: HTMLButtonElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container);

        this._list = this._element.querySelector('.basket__list')!;
        this._total = this._element.querySelector('.basket__price')!;
        this._button = this._element.querySelector('.basket__button')!;

        this._button.addEventListener('click', () => {
            this.events.emit('order:open');
        });
    }

    set items(elements: HTMLElement[]) {
        if (elements.length) {
            this._list.replaceChildren(...elements);
        } else {
            // Создаем простой текстовый узел для "Корзина пуста"
            const emptyMessage = document.createElement('p'); // Можно использовать любой подходящий тег
            emptyMessage.textContent = 'Корзина пуста';
            emptyMessage.style.textAlign = 'center'; // Для центрирования текста
            emptyMessage.style.padding = '20px 0'; // Для отступов
            this._list.replaceChildren(emptyMessage);
        }
    }

    set total(value: number) {
        this.setText(this._total, `${value} синапсов`);
    }

    set buttonText(value: string) {
        if (this._button) {
            this.setText(this._button, value);
        }
    }

    set buttonDisabled(state: boolean) {
        if (this._button) {
            this.setDisabled(this._button, state);
        }
    }

    render(data?: Partial<IBasketView>): HTMLElement {
        if (data?.items) {
            this.items = data.items;
        }
        if (data?.total !== undefined) {
            this.total = data.total;
        }
        if (data?.buttonText !== undefined) { // Используем !== undefined для корректной установки
            this.buttonText = data.buttonText;
        }
        if (data?.buttonDisabled !== undefined) { // Используем !== undefined для корректной установки
            this.buttonDisabled = data.buttonDisabled;
        }

        // Если корзина пуста, отключаем кнопку оформления заказа
        if (data && data.items && data.items.length === 0) {
            this.buttonDisabled = true;
            this.buttonText = 'Корзина пуста'; // Устанавливаем текст, если корзина пуста
        } else {
            this.buttonDisabled = false;
            if (!data?.buttonText) { // Устанавливаем текст "Оформить", если он не был задан явно
                 this.buttonText = 'Оформить';
            }
        }

        return this._element;
    }
}