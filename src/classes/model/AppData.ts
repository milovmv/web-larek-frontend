// src/classes/model/AppData.ts

import { EventEmitter } from '../base/EventEmitter'; 
import { IProduct, IOrderForm, IFormErrors, IOrderResult, IAppState } from '../../types/types'; 
import { FormFieldName } from '../../types/events'; 

// Хранит состояние каталога, корзины, заказа и управляет бизнес-логикой.

export class AppData extends EventEmitter implements IAppState {
    catalog: IProduct[]; // Весь каталог товаров
    basket: IProduct[] = []; // Товары в корзине (полные объекты IProduct)
    order: IOrderForm = { // Данные текущего заказа
        payment: 'card', // Значение по умолчанию
        address: '',
        email: '',
        phone: '',
        items: [],
        total: 0
    };
    preview: string | null = null; // ID товара для предпросмотра
    formErrors: IFormErrors = {}; // Ошибки валидации формы
    protected emitter: EventEmitter; 

    constructor(emitter: EventEmitter) {
        super(); // Вызываем конструктор базового EventEmitter
        this.emitter = emitter; // Сохраняем ссылку на EventEmitter для эмиссии событий
    }

    // --- Методы для управления каталогом ---

    //Устанавливает каталог товаров и эмитирует событие об обновлении.
    setCatalog(items: IProduct[]) {
        this.catalog = items;
        this.emitter.emit('items:changed', { catalog: this.catalog });  // Эмитируем событие об изменении каталога
    }

    //Устанавливает ID товара для предпросмотра и эмитирует событие.
    setPreview(id: string) {
        this.preview = id;
        this.emitter.emit('preview:changed', { id }); // Эмитируем событие об изменении предпросмотра
    }

    //Возвращает товар по его ID из каталога.
    getProduct(id: string): IProduct | undefined {
        return this.catalog.find(item => item.id === id);
    }

    // --- Методы для управления корзиной ---

    // Добавляет товар в корзину.
    addToBasket(item: IProduct) {
        if (!this.basket.some(product => product.id === item.id)) { // Проверяем, нет ли уже товара в корзине
            this.basket.push(item);
            this.updateBasket(); // Обновляем корзину и эмитируем изменения
        }
    }

    // Удаляет товар из корзины по его ID.
    removeFromBasket(id: string) {
        this.basket = this.basket.filter(item => item.id !== id);
        this.updateBasket(); // Обновляем корзину и эмитируем изменения
    }

    // Возвращает текущее содержимое корзины.
    getBasketItems(): IProduct[] {
        return this.basket;
    }

    // Рассчитывает общую стоимость товаров в корзине.
    getBasketTotal(): number {
        return this.basket.reduce((sum, item) => sum + (item.price || 0), 0);
    }

    // Возвращает массив ID товаров в корзине.
    getBasketItemsIds(): string[] {
        return this.basket.map(item => item.id);
    }

    // Очищает корзину.
    clearBasket() {
        this.basket = [];
        this.updateBasket(); // Обновляем корзину и эмитируем изменения
    }

    // Внутренний метод для обновления состояния корзины и эмиссии событий.
    protected updateBasket() {
        this.order.items = this.getBasketItemsIds(); // Обновляем список ID в объекте заказа
        this.order.total = this.getBasketTotal();   // Обновляем общую сумму в объекте заказа
        this.emitter.emit('basket:changed', this.basket); // Эмитируем событие об изменении корзины
    }

    // --- Методы для управления формой заказа ---

    // Устанавливает значение поля заказа.
    setOrderField(field: FormFieldName, value: string) {
        // Проверяем, что поле существует в IOrderForm и не является 'items' или 'total'
        if (field in this.order && field !== 'items' && field !== 'total') {
            (this.order[field] as string) = value; // Приводим к string, так как поля email, phone, address, payment - строки
        }
        // После каждого изменения поля, валидируем форму
        this.validateOrder();
    }

    // Валидирует текущие данные заказа и обновляет ошибки.
    validateOrder(): boolean {
        const errors: IFormErrors = {};
        if (!this.order.payment) {
            errors.payment = 'Необходимо выбрать способ оплаты';
        }
        if (!this.order.address) {
            errors.address = 'Необходимо указать адрес';
        }
        if (!this.order.email) {
            errors.email = 'Необходимо указать email';
        } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(this.order.email)) {
            errors.email = 'Некорректный email';
        }
        if (!this.order.phone) {
            errors.phone = 'Необходимо указать телефон';
        } else if (!/^\+?\d{10,15}$/.test(this.order.phone)) { // Простая валидация номера телефона
            errors.phone = 'Некорректный номер телефона';
        }

        this.formErrors = errors;
        this.emitter.emit('formErrors:changed', this.formErrors); // Эмитируем событие об изменении ошибок

        return Object.keys(errors).length === 0; // Форма валидна, если нет ошибок
    }

    //Сбрасывает данные заказа к начальному состоянию.
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
    }

    // --- Общие методы ---

    // Сбрасывает все данные приложения к начальному состоянию.
    clearAllData() {
        this.basket = [];
        this.resetOrder();
        this.preview = null;
    }
}