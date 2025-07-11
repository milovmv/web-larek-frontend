// src/classes/view/BasketView.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';

// Интерфейс для данных, которые BasketView будет отображать
interface IBasketView {
    items: HTMLElement[]; // Массив HTML-элементов карточек товаров в корзине
    total: number; // Общая стоимость товаров
    buttonText?: string; // Текст кнопки оформления заказа (например, "Оформить" или "Корзина пуста")
    buttonDisabled?: boolean; // Состояние активности кнопки
}

export class BasketView extends Component<IBasketView> {
    // Внутренние ссылки на DOM-элементы корзины
    protected _list: HTMLElement; // Контейнер для списка товаров в корзине (например, <ul>)
    protected _total: HTMLElement; // Элемент для отображения общей стоимости
    protected _button: HTMLButtonElement; // Кнопка оформления заказа

    constructor(container: HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // Вызываем конструктор базового Component, клонируя шаблон

        // Получаем ссылки на элементы внутри клонированного шаблона корзины
        this._list = this._element.querySelector('.basket__list');
        this._total = this._element.querySelector('.basket__price');
        this._button = this._element.querySelector('.basket__button');

        // Вешаем обработчик на кнопку оформления заказа
        if (this._button) {
            this._button.addEventListener('click', () => {
                this.events.emit('order:open'); // Эмитируем событие открытия формы заказа
            });
        }
    }

    set items(elements: HTMLElement[]) {
        // Очищаем текущий список и вставляем новые элементы.
        // Если элементов нет, отображаем сообщение "Корзина пуста"
        if (elements.length) {
            this._list.replaceChildren(...elements);
        } else {
            this._list.replaceChildren(document.createElement('div').textContent = 'Корзина пуста');
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

    render(data?: IBasketView): HTMLElement {
        // Обновляем список товаров, если данные предоставлены
        if (data?.items) {
            this.items = data.items;
        }
        // Обновляем общую стоимость, если данные предоставлены
        if (data?.total !== undefined) {
            this.total = data.total;
        }
        // Обновляем текст кнопки, если данные предоставлены
        if (data?.buttonText) {
            this.buttonText = data.buttonText;
        }
        // Обновляем состояние кнопки, если данные предоставлены
        if (data?.buttonDisabled !== undefined) {
            this.buttonDisabled = data.buttonDisabled;
        }

        // Если корзина пуста, отключаем кнопку оформления заказа
        if (data && data.items && data.items.length === 0) {
            this.buttonDisabled = true;
        } else {
            this.buttonDisabled = false;
        }

        return this._element;
    }
}