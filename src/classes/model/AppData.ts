// src/classes/model/AppData.ts

import { EventEmitter } from '../base/EventEmitter';
import { IProduct, IOrderForm, IFormErrors, IOrderResult, IAppState } from '../../types/types';
// FormFieldName больше не нужен, если вы используете keyof IOrderForm
// import { FormFieldName } from '../../types/events'; 

// Хранит состояние каталога, корзины, заказа и управляет бизнес-логикой.

export class AppData implements IAppState {
    catalog: IProduct[];
    basket: IProduct[] = [];
    order: IOrderForm = {
        payment: 'card',
        address: '',
        email: '',
        phone: '',
        items: [],
        total: 0
    };
    preview: string | null = null;
    formErrors: IFormErrors = {};
    protected events: EventEmitter;

    constructor(events: EventEmitter) {
        this.events = events;
        console.log('AppData: Конструктор вызван. EventEmitter установлен.');
    }

    // --- Методы для управления каталогом ---

    setCatalog(items: IProduct[]) {
        this.catalog = items;
        console.log('AppData: setCatalog вызван. Количество товаров:', this.catalog.length);
        this.events.emit('items:changed', { items: this.catalog });
        console.log('AppData: Событие "items:changed" эмитировано.');
    }

    setPreview(id: string) {
        this.preview = id;
        console.log('AppData: setPreview вызван. ID предпросмотра:', id);
        this.events.emit('preview:changed', { id });
        console.log('AppData: Событие "preview:changed" эмитировано.');
    }

    getProduct(id: string): IProduct | undefined {
        const product = this.catalog.find(item => item.id === id);
        console.log(`AppData: getProduct вызван. ID: ${id}. Найден: ${!!product}`);
        return product;
    }

    // --- Методы для управления корзиной ---

    addToBasket(item: IProduct) {
        if (!this.basket.some(product => product.id === item.id)) {
            this.basket.push(item);
            console.log('AppData: addToBasket вызван. Товар добавлен:', item.title);
            this.updateBasket();
        } else {
            console.log('AppData: addToBasket вызван. Товар уже в корзине:', item.title);
        }
    }

    removeFromBasket(id: string) {
        const initialLength = this.basket.length;
        this.basket = this.basket.filter(item => item.id !== id);
        if (this.basket.length < initialLength) {
            console.log('AppData: removeFromBasket вызван. Товар удален. ID:', id);
            this.updateBasket();
        } else {
            console.log('AppData: removeFromBasket вызван. Товар не найден для удаления. ID:', id);
        }
    }

    getBasketItems(): IProduct[] {
        console.log('AppData: getBasketItems вызван. Товаров в корзине:', this.basket.length);
        return this.basket;
    }

    getBasketTotal(): number {
        const total = this.basket.reduce((sum, item) => sum + (item.price || 0), 0);
        console.log('AppData: getBasketTotal вызван. Общая сумма:', total);
        return total;
    }

    getBasketItemsIds(): string[] {
        const ids = this.basket.map(item => item.id);
        console.log('AppData: getBasketItemsIds вызван. ID товаров в корзине:', ids);
        return ids;
    }

    clearBasket() {
        this.basket = [];
        console.log('AppData: clearBasket вызван. Корзина очищена.');
        this.updateBasket();
    }

    protected updateBasket() {
        this.order.items = this.getBasketItemsIds();
        this.order.total = this.getBasketTotal();
        console.log('AppData: updateBasket вызван. Корзина обновлена. Товар ID:', this.order.items, 'Сумма:', this.order.total);
        this.events.emit('basket:changed', this.basket);
        console.log('AppData: Событие "basket:changed" эмитировано.');
    }

    // --- Методы для управления формой заказа ---

    // Устанавливает значение поля заказа.
    setOrderField(field: keyof IOrderForm, value: string) {
        if (field === 'payment' || field === 'address' || field === 'email' || field === 'phone') {
             (this.order[field] as string) = value;
             console.log(`AppData: setOrderField вызван. Поле: '${field}', Значение: '${value}'.`);
             // Валидацию теперь вызывают в презентере
        } else {
            console.warn(`AppData: setOrderField вызван с некорректным полем: '${field}'.`);
        }
    }

    setPaymentMethod(method: 'card' | 'cash') {
        this.order.payment = method;
        console.log(`AppData: setPaymentMethod вызван. Метод оплаты: '${method}'.`);
        // Валидацию теперь вызывают в презентере
    }

    /**
     * Валидирует текущие данные заказа и обновляет ошибки в зависимости от текущего шага формы.
     * @param currentFormType Тип текущей формы ('address' или 'contacts').
     */
    validateOrder(currentFormType: 'address' | 'contacts'): boolean { // <-- ИЗМЕНЕНО
        const errors: IFormErrors = {};

        if (currentFormType === 'address') {
            // Валидация способа оплаты
            if (!this.order.payment) {
                errors.payment = 'Необходимо выбрать способ оплаты';
            }

            // Валидация адреса
            if (!this.order.address || this.order.address.trim() === '') {
                errors.address = 'Необходимо указать адрес доставки';
            } else if (this.order.address.trim().length < 5) { // Простая валидация длины адреса
                errors.address = 'Адрес должен содержать не менее 5 символов';
            }
        } else if (currentFormType === 'contacts') {
            // Валидация email
            if (!this.order.email || this.order.email.trim() === '') {
                errors.email = 'Необходимо указать email';
            } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(this.order.email)) {
                errors.email = 'Некорректный email';
            }

            // Валидация телефона
            if (!this.order.phone || this.order.phone.trim() === '') {
                errors.phone = 'Необходимо указать телефон';
            } else if (!/^\+?\d{10,15}$/.test(this.order.phone)) { // Простая валидация номера телефона
                errors.phone = 'Некорректный номер телефона';
            }
        } else {
            // Если передан неизвестный тип формы, можно выбросить ошибку или валидировать все
            console.warn(`AppData: validateOrder вызван с неизвестным типом формы: ${currentFormType}. Валидация не выполнена.`);
        }

        this.formErrors = errors;
        console.log(`AppData: Валидация заказа (${currentFormType}) завершена. Ошибки:`, errors);
        this.events.emit('formErrors:changed', this.formErrors);
        console.log('AppData: Событие "formErrors:changed" эмитировано.');

        const isValid = Object.keys(errors).length === 0;
        this.events.emit('orderForm:validity:changed', { isValid: isValid, errors: errors });
        console.log(`AppData: Событие "orderForm:validity:changed" эмитировано. Валидно: ${isValid}`);

        return isValid;
    }

    resetOrder() {
        this.order = {
            payment: 'card',
            address: '',
            email: '',
            phone: '',
            items: [],
            total: 0
        };
        this.formErrors = {};
        console.log('AppData: resetOrder вызван. Данные заказа сброшены.');
    }

    // --- Общие методы ---

    clearAllData() {
        this.basket = [];
        this.resetOrder();
        this.preview = null;
        console.log('AppData: clearAllData вызван. Все данные приложения сброшены.');
    }
}