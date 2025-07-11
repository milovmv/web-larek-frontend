// src/classes/view/OrderFormContacts.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderForm, IFormErrors } from '../../types/types'; // Интерфейс для полных данных формы заказа
import { FormFieldName, IOrderFieldChangeEvent } from '../../types/events'; // Типы для событий полей формы

interface IOrderFormContacts {
    email: string;
    phone: string;
    valid: boolean; // Общее состояние валидации формы
    errors: IFormErrors; // Сообщения об ошибках
}

export class OrderFormContacts extends Component<IOrderFormContacts> {
    // Внутренние ссылки на DOM-элементы формы
    protected _emailInput: HTMLInputElement;   // Поле ввода email
    protected _phoneInput: HTMLInputElement;   // Поле ввода телефона
    protected _submitButton: HTMLButtonElement; // Кнопка "Оплатить" или "Завершить"
    protected _errorsContainer: HTMLElement;   // Контейнер для отображения ошибок

    constructor(container: HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // Вызываем конструктор базового Component, клонируя шаблон

        // Получаем ссылки на элементы внутри клонированной формы
        this._emailInput = this._element.querySelector('[name="email"]');
        this._phoneInput = this._element.querySelector('[name="phone"]');
        this._submitButton = this._element.querySelector('.button'); // Кнопка "Оплатить" в этой форме
        this._errorsContainer = this._element.querySelector('.form__errors');

        // Вешаем обработчики событий для полей ввода
        if (this._emailInput) {
            this._emailInput.addEventListener('input', (evt: Event) => {
                const target = evt.target as HTMLInputElement;
                this.events.emit<IOrderFieldChangeEvent>('order:contactsInput', {
                    field: 'email',
                    value: target.value
                });
            });
        }

        if (this._phoneInput) {
            this._phoneInput.addEventListener('input', (evt: Event) => {
                const target = evt.target as HTMLInputElement;
                this.events.emit<IOrderFieldChangeEvent>('order:contactsInput', {
                    field: 'phone', 
                    value: target.value
                });
            });
        }

        // Вешаем обработчик на кнопку отправки формы
        if (this._submitButton) {
            this._submitButton.addEventListener('click', (evt) => {
                evt.preventDefault();
                this.events.emit('order:success'); 
            });
        }
    }

    set email(value: string) {
        if (this._emailInput) {
            this._emailInput.value = value;
        }
    }

    set phone(value: string) {
        if (this._phoneInput) {
            this._phoneInput.value = value;
        }
    }

    set valid(state: boolean) {
        if (this._submitButton) {
            this.setDisabled(this._submitButton, !state); // Кнопка активна, если форма валидна
        }
    }

    set errors(value: IFormErrors) {
        let combinedErrors: string[] = [];

        if (value.email) { 
            combinedErrors.push(`Email: ${value.email}`); 
        }
        if (value.phone) { 
            combinedErrors.push(`Телефон: ${value.phone}`); 
        }

        // Обновляем текст в элементе ошибок
        this.setText(this._errorsContainer, combinedErrors.join('; ') || '');
        // Управляем видимостью элемента ошибок
        this.toggleClass(this._errorsContainer, 'form__error_active', combinedErrors.length > 0);

        // Также, если есть ошибки, можно деактивировать кнопку отправки формы
        this.setDisabled(this._submitButton, combinedErrors.length > 0);
    }

    render(data?: Partial<IOrderFormContacts>): HTMLElement {
        if (data?.email !== undefined) {
            this.email = data.email;
        }
        if (data?.phone !== undefined) {
            this.phone = data.phone;
        }
        if (data?.valid !== undefined) {
            this.valid = data.valid;
        }
        if (data?.errors !== undefined) {
            this.errors = data.errors;
        }

        return this._element;
    }
}