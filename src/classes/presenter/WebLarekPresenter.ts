// src/classes/presenter/WebLarekPresenter.ts

// Basic utility classes
import { EventEmitter } from '../base/EventEmitter';

// Model classes for application data and cart logic
import { AppData } from '../model/AppData';
import { CartService } from '../model/CartService';

// View components that handle UI rendering and user interaction
import { Page } from '../view/Page';
import { Card, ICardData, ICardActions } from '../view/Card';
import { Modal } from '../view/Modal';
import { BasketView } from '../view/BasketView';
import { OrderFormAddress } from '../view/OrderFormAddress';
import { OrderFormContacts } from '../view/OrderFormContacts';
import { SuccessView } from '../view/SuccessView';

// Type definitions for products, order results, form errors, and event data
import { IProduct, IOrderResult, IFormErrors } from '../../types/types';
import { IOrderFieldChangeEvent } from '../../types/events';

// API service and constants for data fetching
import { LarekApi } from '../../larekApi';
import { API_URL, CDN_URL } from '../../utils/constants';


/**
 * @class WebLarekPresenter
 * @description The main presenter class that orchestrates the logic of the "Web Larek" application.
 * It connects view components, the model (AppData), and external services (API).
 */
export class WebLarekPresenter {
    protected api: LarekApi;
    protected appData: AppData;
    protected cartService: CartService;
    protected events: EventEmitter;

    protected page: Page;
    protected modal: Modal;
    protected basketView: BasketView;
    protected orderFormAddress: OrderFormAddress;
    protected orderFormContacts: OrderFormContacts;
    protected successView: SuccessView;

    protected cardCatalogTemplate: HTMLTemplateElement;
    protected cardPreviewTemplate: HTMLTemplateElement;
    protected basketItemTemplate: HTMLTemplateElement;
    protected CardComponent: typeof Card; // Добавил для возможности создания карточек в презентере

    constructor(
        events: EventEmitter,
        api: LarekApi,
        appData: AppData,
        cartService: CartService,
        page: Page,
        modal: Modal,
        basketView: BasketView,
        orderFormAddress: OrderFormAddress,
        orderFormContacts: OrderFormContacts,
        successView: SuccessView,
        cardCatalogTemplate: HTMLTemplateElement,
        cardPreviewTemplate: HTMLTemplateElement,
        basketItemTemplate: HTMLTemplateElement,
        CardComponent: typeof Card // Принимаем класс Card
    ) {
        // --- 1. Initialize Core Services ---
        this.events = events;
        this.api = api;
        this.appData = appData;
        this.cartService = cartService;

        // --- 2. Initialize View Components ---
        this.page = page;
        this.modal = modal;
        this.basketView = basketView;
        this.orderFormAddress = orderFormAddress;
        this.orderFormContacts = orderFormContacts;
        this.successView = successView;

        // --- 3. Store HTML Template elements ---
        this.cardCatalogTemplate = cardCatalogTemplate;
        this.cardPreviewTemplate = cardPreviewTemplate;
        this.basketItemTemplate = basketItemTemplate;
        this.CardComponent = CardComponent; // Сохраняем класс Card

        // --- 4. Register Global Event Listeners (Main Presenter Logic) ---

        // --- 4.1. Catalog and Product Card Events ---
        this.events.on('items:changed', (data: { catalog: IProduct[] }) => {
            this.page.catalog = data.catalog.map(item => {
                const cardData: ICardData = {
                    ...item,
                    buttonText: item.price === null ? 'Бесценно' : (this.cartService.isProductInCart(item.id) ? 'Удалить из корзины' : 'В корзину'),
                    buttonDisabled: item.price === null,
                    description: undefined,
                    index: undefined
                };

                const card = new this.CardComponent(this.cardCatalogTemplate.content.firstElementChild as HTMLElement, this.events, {
                    onClick: () => this.events.emit('card:select', { id: item.id }),
                    onButtonClick: () => {
                         if (this.cartService.isProductInCart(item.id)) {
                             this.events.emit('product:remove', { id: item.id });
                         } else {
                             this.events.emit('product:add', item);
                         }
                    }
                });
                return card.render(cardData);
            });
        });

        this.events.on('card:select', (data: { id: string }) => {
            const product = this.appData.getProduct(data.id);
            if (product) {
                this.appData.setPreview(product.id);

                const cardData: ICardData = {
                    ...product,
                    description: product.description,
                    buttonText: product.price === null ? 'Бесценно' : (this.cartService.isProductInCart(product.id) ? 'Удалить из корзины' : 'В корзину'),
                    buttonDisabled: product.price === null,
                    index: undefined
                };

                const previewCard = new this.CardComponent(this.cardPreviewTemplate.content.firstElementChild as HTMLElement, this.events, {
                    onButtonClick: () => {
                        if (this.cartService.isProductInCart(product.id)) {
                            this.events.emit('product:remove', { id: product.id });
                        } else {
                            this.events.emit('product:add', product);
                        }
                    }
                });
                this.modal.render({ content: previewCard.render(cardData) });
            }
        });

        // --- 4.2. Shopping Cart Events ---
        this.events.on('basket:open', () => {
            this.updateBasketView();
            this.modal.render({ content: this.basketView.render() });
        });

        this.events.on('product:add', (item: IProduct) => {
            this.cartService.addProduct(item);
            this.modal.close();
            this.page.counter = this.cartService.getCartItemCount();
            this.updateCatalogCards();
        });

        this.events.on('product:remove', (data: { id: string }) => {
            this.cartService.removeProduct(data.id);
            this.page.counter = this.cartService.getCartItemCount();
            this.updateBasketView();
            this.updateCatalogCards();

            if (this.modal.content && this.modal.content.classList.contains('card_full')) {
                const currentPreviewId = this.appData.preview;
                if (currentPreviewId && currentPreviewId === data.id) {
                    this.appData.setPreview(currentPreviewId);
                }
            }
        });

        this.events.on('cart:changed', () => {
            this.updateBasketView();
            this.updateCatalogCards();
        });

        // --- 4.3. Order Form Events (Step 1: Address and Payment) ---
        this.events.on('order:open', () => {
            if (this.cartService.getCartItemCount() === 0) {
                console.warn('Cannot place an order with an empty cart.');
                alert('Нельзя оформить пустой заказ.');
                this.modal.close();
                return;
            }
            this.appData.resetOrder();
            this.appData.order.items = this.cartService.getCartItemsIds();
            this.appData.order.total = this.cartService.getCartTotal();

            this.modal.render({
                content: this.orderFormAddress.render({
                    address: this.appData.order.address,
                    payment: this.appData.order.payment,
                    errors: this.appData.formErrors
                })
            });
        });

        this.events.on('order:field:change', (data: IOrderFieldChangeEvent) => {
            this.appData.setOrderField(data.field, data.value);
        });

        this.events.on('order:submit', () => {
            if (this.appData.validateOrder()) {
                this.modal.render({
                    content: this.orderFormContacts.render({
                        email: this.appData.order.email,
                        phone: this.appData.order.phone,
                        errors: this.appData.formErrors
                    })
                });
            } else {
                this.orderFormAddress.errors = this.appData.formErrors;
            }
        });

        // --- 4.4. Order Form Events (Step 2: Contacts) ---
        this.events.on('contacts:field:change', (data: IOrderFieldChangeEvent) => {
            this.appData.setOrderField(data.field, data.value);
        });

        this.events.on('contacts:submit', async () => {
            if (this.appData.validateOrder()) {
                try {
                    const orderResult: IOrderResult = await this.api.postOrder(this.appData.order);

                    this.modal.render({ content: this.successView.render({ total: orderResult.total }) });

                    this.cartService.clearCart();
                    this.appData.resetOrder();
                    this.page.counter = 0;
                    this.updateCatalogCards();
                } catch (error) {
                    console.error('Error submitting order:', error);
                    alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
                }
            } else {
                this.orderFormContacts.errors = this.appData.formErrors;
            }
        });

        // --- 4.5. Modal and Form Validation Events ---
        this.events.on('formErrors:changed', (errors: IFormErrors) => {
            if (this.modal.content) {
                if (this.modal.content.classList.contains('order')) {
                    this.orderFormAddress.errors = errors;
                    this.orderFormAddress.valid = Object.keys(errors).length === 0;
                } else if (this.modal.content.classList.contains('contacts')) {
                    this.orderFormContacts.errors = errors;
                    this.orderFormContacts.valid = Object.keys(errors).length === 0;
                }
            }
        });

        this.events.on('modal:open', () => {
            this.page.locked = true;
        });

        this.events.on('modal:close', () => {
            this.page.locked = false;
            this.appData.setPreview(null);
            this.appData.resetOrder();
        });

        this.events.on('success:close', () => {
            this.modal.close();
        });
    }

    protected updateBasketView() {
        const basketItems = this.cartService.getCartItems();
        const basketElements = basketItems.map((item, index) => {
            const cardData: ICardData = {
                ...item,
                index: index + 1,
                buttonText: 'Удалить',
                buttonDisabled: false,
                description: undefined
            };
            const card = new this.CardComponent(this.basketItemTemplate.content.firstElementChild as HTMLElement, this.events, {
                onButtonClick: () => this.events.emit('product:remove', { id: item.id })
            });
            return card.render(cardData);
        });

        const isBasketEmpty = basketItems.length === 0;
        this.basketView.render({
            items: basketElements,
            total: this.cartService.getCartTotal(),
            buttonDisabled: isBasketEmpty,
            buttonText: isBasketEmpty ? 'Корзина пуста' : 'Оформить' // ИСПРАВЛЕН ТЕКСТ КНОПКИ
        });
    }

    protected updateCatalogCards() {
        const updatedCatalogElements = this.appData.catalog.map(item => {
            const cardData: ICardData = {
                ...item,
                buttonText: item.price === null ? 'Бесценно' : (this.cartService.isProductInCart(item.id) ? 'Удалить из корзины' : 'В корзину'),
                buttonDisabled: item.price === null,
                description: undefined,
                index: undefined
            };
            const card = new this.CardComponent(this.cardCatalogTemplate.content.firstElementChild as HTMLElement, this.events, {
                onClick: () => this.events.emit('card:select', { id: item.id }),
                onButtonClick: () => {
                     if (this.cartService.isProductInCart(item.id)) {
                         this.events.emit('product:remove', { id: item.id });
                     } else {
                         this.events.emit('product:add', item);
                     }
                }
            });
            return card.render(cardData);
        });
        this.page.catalog = updatedCatalogElements;
    }
}