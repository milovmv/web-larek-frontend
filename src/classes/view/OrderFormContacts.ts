// src/classes/view/OrderFormContacts.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderForm, IFormErrors } from '../../types/types';
import { FormFieldName, IOrderFieldChangeEvent } from '../../types/events';

interface IOrderFormContacts {
    email: string;
    phone: string;
    valid: boolean;
    errors: IFormErrors;
}

export class OrderFormContacts extends Component<IOrderFormContacts> {
    protected _emailInput: HTMLInputElement;
    protected _phoneInput: HTMLInputElement;
    protected _submitButton: HTMLButtonElement;
    protected _errorsContainer: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container);

        this._emailInput = this._element.querySelector('[name="email"]')!;
        this._phoneInput = this._element.querySelector('[name="phone"]')!;
        this._submitButton = this._element.querySelector('.button')!; // Кнопка "Оплатить"
        this._errorsContainer = this._element.querySelector('.form__errors')!;

        this._emailInput.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            this.events.emit<IOrderFieldChangeEvent>('contacts:field:change', {
                field: 'email',
                value: target.value
            });
        });

        this._phoneInput.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            this.events.emit<IOrderFieldChangeEvent>('contacts:field:change', {
                field: 'phone',
                value: target.value
            });
        });

        this._submitButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.events.emit('contacts:submit'); // ИСПРАВЛЕНО СОБЫТИЕ
        });
    }

    set email(value: string) {
        this._emailInput.value = value;
    }

    set phone(value: string) {
        this._phoneInput.value = value;
    }

    set valid(state: boolean) {
        this.setDisabled(this._submitButton, !state);
    }

    set errors(value: IFormErrors) {
        const errorMessages: string[] = [];
        if (value.email) errorMessages.push(value.email);
        if (value.phone) errorMessages.push(value.phone);

        this.setText(this._errorsContainer, errorMessages.join('; '));
        this.toggleClass(this._errorsContainer, 'form__errors_active', errorMessages.length > 0); // ИСПРАВЛЕН КЛАСС АКТИВАЦИИ
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