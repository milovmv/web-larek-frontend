// src/classes/view/SuccessView.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderResult } from '../../types/types'; // Интерфейс для результата заказа

interface ISuccessView {
    total: number; // Итоговая сумма заказа
}

export class SuccessView extends Component<ISuccessView> {
    // Внутренние ссылки на DOM-элементы окна успеха
    protected _closeButton: HTMLButtonElement; // Кнопка закрытия модального окна
    protected _totalDisplay: HTMLElement;      // Элемент для отображения итоговой суммы

    constructor(container: HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // Вызываем конструктор базового Component, клонируя шаблон

        // Получаем ссылки на элементы внутри клонированного шаблона успеха
        this._closeButton = this._element.querySelector('.order-success__close');
        this._totalDisplay = this._element.querySelector('.order-success__description');

        // Вешаем обработчик события на кнопку закрытия
        if (this._closeButton) {
            this._closeButton.addEventListener('click', () => {
                this.events.emit('success:close'); // Эмитируем событие закрытия окна успеха
            });
        }
    }

    set total(value: number) {
        this.setText(this._totalDisplay, `Списано ${value} синапсов`);
    }
    
    render(data?: Partial<ISuccessView>): HTMLElement {
        if (data?.total !== undefined) {
            this.total = data.total;
        }
        return this._element;
    }
}