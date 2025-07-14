// src/classes/view/OrderFormAddress.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderForm, IFormErrors } from '../../types/types';

interface IOrderFormAddress {
    address: string;
    payment: string;
    valid: boolean;
    errors: IFormErrors;
}

export class OrderFormAddress extends Component<IOrderFormAddress> {
    protected _paymentButtons: HTMLButtonElement[];
    protected _addressInput: HTMLInputElement;
    protected _submitButton: HTMLButtonElement;
    protected _errorsContainer: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container);

        this._paymentButtons = Array.from(this._element.querySelectorAll('.button_alt'));
        this._addressInput = this._element.querySelector('[name="address"]')!;
        this._submitButton = this._element.querySelector('.order__button')!;
        this._errorsContainer = this._element.querySelector('.form__errors')!;

        this._paymentButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.events.emit('order:field:change', { field: 'payment', value: button.name });
            });
        });

        this._addressInput.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            this.events.emit('order:field:change', {
                field: 'address',
                value: target.value
            });
        });

        this._submitButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.events.emit('order:submit');
        });
    }

    set address(value: string) {
        this._addressInput.value = value;
    }

    set payment(value: string) {
        this._paymentButtons.forEach(button => {
            this.toggleClass(button, 'button_alt-active', button.name === value);
        });
    }

    set valid(state: boolean) {
        this.setDisabled(this._submitButton, !state);
    }

    set errors(value: IFormErrors) {
        const errorMessages: string[] = [];
        if (value.address) errorMessages.push(value.address);
        if (value.payment) errorMessages.push(value.payment);

        this.setText(this._errorsContainer, errorMessages.join('; '));
        this.toggleClass(this._errorsContainer, 'form__errors_active', errorMessages.length > 0); // ИСПРАВЛЕН КЛАСС АКТИВАЦИИ
    }

    render(data?: Partial<IOrderFormAddress>): HTMLElement {
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