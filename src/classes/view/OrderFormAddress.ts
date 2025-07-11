// src/classes/view/OrderFormAddress.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderForm, IFormErrors } from '../../types/types';

interface IOrderFormAddress {
    address: string;
    payment: string;
    valid: boolean; // Общее состояние валидации формы
    errors: IFormErrors; // Сообщения об ошибках
}

export class OrderFormAddress extends Component<IOrderFormAddress> {
    // Внутренние ссылки на DOM-элементы формы
    protected _paymentButtons: HTMLButtonElement[]; // Кнопки выбора способа оплаты
    protected _addressInput: HTMLInputElement; // Поле ввода адреса
    protected _submitButton: HTMLButtonElement; // Кнопка "Далее" или "Оформить"
    protected _errorsContainer: HTMLElement; // Контейнер для отображения ошибок

    constructor(container: HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // Вызываем конструктор базового Component, клонируя шаблон

        this._paymentButtons = Array.from(this._element.querySelectorAll('.button_alt'));
        this._addressInput = this._element.querySelector('[name="address"]');
        this._submitButton = this._element.querySelector('.order__button');
        this._errorsContainer = this._element.querySelector('.form__errors');

        // Вешаем обработчики событий
        this._paymentButtons.forEach(button => {
            button.addEventListener('click', () => {
                this._paymentButtons.forEach(btn => btn.classList.remove('button_alt-active'));
                button.classList.add('button_alt-active');
                this.events.emit('order:paymentSelected', { payment: button.name });
            });
        });

        if (this._addressInput) {
            this._addressInput.addEventListener('input', (evt: Event) => {
                const target = evt.target as HTMLInputElement;
                this.events.emit('order:addressInput', {
                    field: 'address',
                    value: target.value
                });
            });
        }

        if (this._submitButton) {
            this._submitButton.addEventListener('click', (evt) => {
                evt.preventDefault(); 
                this.events.emit('order:submit'); 
            });
        }
    }

    set address(value: string) {
        if (this._addressInput) {
            this._addressInput.value = value;
        }
    }

    set payment(value: string) {
        this._paymentButtons.forEach(button => {
            this.toggleClass(button, 'button_alt-active', button.name === value);
        });
    }

    set valid(state: boolean) {
        if (this._submitButton) {
            this.setDisabled(this._submitButton, !state); // Кнопка активна, если форма валидна
        }
    }

    set errors(value: IFormErrors) {
        let combinedErrors: string[] = [];

        if (value.address) {
            combinedErrors.push(`Адрес: ${value.address}`);
        }
        if (value.payment) {
            combinedErrors.push(`Оплата: ${value.payment}`);
        }

        // Обновляем текст в элементе ошибок
        this.setText(this._errorsContainer, combinedErrors.join('; ') || '');
        // Управляем видимостью элемента ошибок
        this.toggleClass(this._errorsContainer, 'form__error_active', combinedErrors.length > 0);

        // Также, если есть ошибки, можно деактивировать кнопку отправки формы
        this.setDisabled(this._submitButton, combinedErrors.length > 0);
    }

    render(data?: Partial<IOrderFormAddress>): HTMLElement { // Partial для опциональных данных
        if (data?.address !== undefined) {
            this.address = data.address;
        }
        if (data?.payment !== undefined) {
            this.payment = data.payment;
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