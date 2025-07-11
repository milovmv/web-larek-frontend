// src/views/Page.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';

// Интерфейс для данных, которые Page может отображать или использовать.
interface IPage {
    counter: number; // Количество товаров в корзине
    catalog: HTMLElement[]; // Массив HTML-элементов карточек товаров
}

export class Page extends Component<IPage> {
    // Ссылки на DOM-элементы, которыми управляет класс Page
    protected _counter: HTMLElement; // Элемент счетчика корзины
    protected _catalog: HTMLElement; // Контейнер для галереи товаров
    protected _basket: HTMLButtonElement; // Кнопка корзины

    constructor(container: HTMLElement, protected events: EventEmitter) {

        super(container);

        // Получаем ссылки на элементы главной страницы
        this._counter = this._element.querySelector('.header__basket-counter');
        this._catalog = this._element.querySelector('.gallery');
        this._basket = this._element.querySelector('.header__basket');

        // Вешаем обработчик события на кнопку корзины
        if (this._basket) {
            this._basket.addEventListener('click', () => {
                this.events.emit('basket:open'); // Эмитируем событие открытия корзины
            });
        }
    }

    set counter(value: number) {
        this.setText(this._counter, String(value)); // Используем protected setText из Component
    }

    set catalog(items: HTMLElement[]) {
        // Очищаем текущее содержимое каталога и вставляем новые элементы.
        if (this._catalog) {
            this._catalog.replaceChildren(...items);
        }
    }

    render(data?: IPage): HTMLElement {
        // Обновляем счетчик, если данные предоставлены
        if (data?.counter !== undefined) {
            this.counter = data.counter;
        }
        // Обновляем каталог, если данные предоставлены
        if (data?.catalog) {
            this.catalog = data.catalog;
        }
        return this._element; // Возвращаем корневой элемент, как требует Component
    }
}