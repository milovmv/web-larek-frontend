// src/classes/view/OrderFormAddress.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderForm, IFormErrors } from '../../types/types'; // Убедитесь, что IOrderForm и IFormErrors импортированы корректно
import { ensureElement } from '../../utils/utils'; // Предполагаем, что у вас есть ensureElement

// Интерфейс для данных, которые OrderFormAddress может отображать
// Обычно это подмножество IOrderForm, плюс состояние валидации и ошибок
interface IOrderFormAddressRenderData {
    address?: string; // Может быть опциональным при рендере
    payment?: string; // Может быть опциональным при рендере
    valid?: boolean; // Состояние валидности всей формы
    errors?: IFormErrors; // Объект с ошибками для каждого поля
}

export class OrderFormAddress extends Component<IOrderFormAddressRenderData> {
    protected _paymentButtons: HTMLButtonElement[];
    protected _addressInput: HTMLInputElement;
    protected _submitButton: HTMLButtonElement;
    protected _errorsContainer: HTMLElement;

    constructor(container: HTMLElement | HTMLTemplateElement, protected events: EventEmitter) {
        super(container); // super() вызовет cloneTemplate и установит this._element

        this._element.classList.add('order');

        // Используем ensureElement для получения элементов.
        // Это безопасно и явно говорит TypeScript, что элементы не будут null.
        this._paymentButtons = Array.from(this._element.querySelectorAll('.button_alt'));
        this._addressInput = ensureElement<HTMLInputElement>('[name="address"]', this._element);
        this._submitButton = ensureElement<HTMLButtonElement>('.order__button', this._element);
        this._errorsContainer = ensureElement<HTMLElement>('.form__errors', this._element);

        console.log('OrderFormAddress: Constructor called.');

        // --- Привязка обработчиков событий ---

        // Обработчик для кнопок оплаты
        this._paymentButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log(`OrderFormAddress: Payment button '${button.name}' clicked.`);
                // Эмитируем событие, специфичное для изменения способа оплаты
                // В WebLarekPresenter мы будем слушать 'order:payment:changed'
                this.events.emit('order:payment:changed', { method: button.name });
                console.log(`OrderFormAddress: Emitted 'order:payment:changed' with method: ${button.name}`);
            });
        });

        // Обработчик для поля ввода адреса
        this._addressInput.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            console.log(`OrderFormAddress: Address input changed. Value: ${target.value}`);
            // Эмитируем общее событие для изменения поля формы
            // В WebLarekPresenter мы будем слушать 'formField:changed'
            this.events.emit('formField:changed', {
                field: 'address', // Имя поля
                value: target.value // Новое значение поля
            });
            console.log(`OrderFormAddress: Emitted 'formField:changed' for address.`);
        });

        // Обработчик для кнопки "Далее" (отправки формы)
        this._submitButton.addEventListener('click', (evt) => {
            evt.preventDefault(); // Предотвращаем стандартную отправку формы
            console.log('OrderFormAddress: Submit button clicked.');
            this.events.emit('order:submit'); // Эмитируем событие для перехода к следующему шагу
            console.log('OrderFormAddress: Emitted "order:submit".');
        });
    }

    // --- Сеттеры для обновления UI ---

    // Устанавливает значение поля адреса
    set address(value: string) {
        this._addressInput.value = value;
    }

    // Устанавливает активную кнопку оплаты
    set payment(value: string) {
        this._paymentButtons.forEach(button => {
            this.toggleClass(button, 'button_alt-active', button.name === value);
        });
    }

    // Управляет активностью кнопки "Далее"
    set valid(value: boolean) {
        this._submitButton.disabled = !value;
    }

    // Отображает сообщения об ошибках
    set errors(value: IFormErrors) {
        const errorMessages: string[] = [];
        // Собираем все сообщения об ошибках из объекта IFormErrors
        // Проверяем, что value.address и value.payment существуют и не пусты
        if (value.address) errorMessages.push(value.address);
        if (value.payment) errorMessages.push(value.payment);

        this.setText(this._errorsContainer, errorMessages.join('; '));
        // Класс 'form__errors_active' добавляется, если есть хотя бы одно сообщение об ошибке
        this.toggleClass(this._errorsContainer, 'form__errors_active', errorMessages.length > 0);
    }

    // --- Метод render для обновления формы ---
    public render(data?: Partial<IOrderFormAddressRenderData>): HTMLElement {
        if (data?.address !== undefined) {
            this.address = data.address;
        }
        if (data?.payment !== undefined) {
            this.payment = data.payment;
        }
        // Эти поля обязательно должны быть переданы презентером для корректного отображения
        if (data?.valid !== undefined) {
            this.valid = data.valid;
        }
        if (data?.errors !== undefined) {
            this.errors = data.errors;
        }

        return this._element;
    }
}