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
import { IProduct, IOrderResult, IFormErrors, IOrderForm } from '../../types/types';
// import { IOrderFieldChangeEvent } from '../../types/events'; // Этот импорт, возможно, уже не нужен, если не используется явно

// API service and constants for data fetching
import { LarekApi } from '../../larekApi';

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

    // --- ДОБАВЛЕНО/ПЕРЕМЕЩЕНО: Свойство для отслеживания активной формы заказа ---
    protected activeOrderForm: 'address' | 'contacts' | null = null;

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
        basketItemTemplate: HTMLTemplateElement
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

        console.log('WebLarekPresenter: Конструктор вызван. Инициализация обработчиков событий...');

        // --- 4. Register Global Event Listeners (Main Presenter Logic) ---

        // --- 4.1. Catalog and Product Card Events ---

        this.events.on('items:changed', (data: { items: IProduct[] }) => {
            console.log('WebLarekPresenter: Получено "items:changed". Рендеринг каталога.');
            this.renderCatalogItems(data.items);
        });

        this.events.on('card:select', (data: { id: string }) => {
            console.log('WebLarekPresenter: Получено "card:select". ID товара:', data.id);
            const product = this.appData.getProduct(data.id);
            if (product) {
                this.appData.setPreview(product.id);

                const previewCard = new Card(this.cardPreviewTemplate, this.events, {
                    onButtonClick: () => {
                        if (this.cartService.isProductInCart(product.id)) {
                            this.events.emit('product:remove', { id: product.id });
                        } else {
                            this.events.emit('product:add', product);
                        }
                    }
                });

                const cardData: ICardData = {
                    ...product,
                    description: product.description,
                    buttonText: product.price === null ? 'Бесценно' : (this.cartService.isProductInCart(product.id) ? 'Удалить из корзины' : 'В корзину'),
                    buttonDisabled: product.price === null,
                    index: undefined
                };
                const renderedPreviewElement = previewCard.render(cardData);

                this.modal.render({ content: renderedPreviewElement });
                console.log(`WebLarekPresenter: Отображен предпросмотр товара: ${product.title}`);
            } else {
                console.warn(`WebLarekPresenter: Товар с ID ${data.id} не найден для предпросмотра.`);
            }
        });

        // --- 4.2. Shopping Cart Events ---
        this.events.on('basket:open', () => {
            console.log('WebLarekPresenter: Получено "basket:open". Открытие корзины.');
            this.updateBasketView();
            this.modal.render({ content: this.basketView.render() });
        });

        this.events.on('product:add', (item: IProduct) => {
            console.log('WebLarekPresenter: Получено "product:add". Добавление товара:', item.title);
            this.cartService.addProduct(item);
            this.modal.close();
            this.page.counter = this.cartService.getCartItemCount();
            this.updateCatalogCards();
        });

        this.events.on('product:remove', (data: { id: string }) => {
            console.log('WebLarekPresenter: Получено "product:remove". Удаление товара ID:', data.id);
            this.cartService.removeProduct(data.id);
            this.page.counter = this.cartService.getCartItemCount();
            this.updateBasketView();
            this.updateCatalogCards();

            if (this.appData.preview && this.appData.preview === data.id) {
                const currentPreviewProduct = this.appData.getProduct(data.id);
                if (currentPreviewProduct) {
                    this.events.emit('card:select', { id: data.id });
                } else {
                    this.modal.close();
                }
            }
        });

        this.events.on('cart:changed', () => {
            console.log('WebLarekPresenter: Получено "cart:changed". Обновление корзины и каталога.');
            this.updateBasketView();
            this.updateCatalogCards();
        });

        // --- 4.3. Order Form Events (Step 1: Address and Payment) ---
        this.events.on('order:open', () => {
            console.log('WebLarekPresenter: Получено "order:open". Открытие формы заказа (адрес).');
            if (this.cartService.getCartItemCount() === 0) {
                console.warn('WebLarekPresenter: Нельзя оформить заказ с пустой корзиной.');
                alert('Нельзя оформить пустой заказ.');
                this.modal.close();
                return;
            }

            // Сброс данных заказа и заполнение из корзины
            this.appData.resetOrder();
            this.appData.order.items = this.cartService.getCartItemsIds();
            this.appData.order.total = this.cartService.getCartTotal();

            // --- КРИТИЧЕСКИ ВАЖНОЕ ИЗМЕНЕНИЕ ---
            // 1. Устанавливаем активную форму ПЕРЕД валидацией и рендерингом
            this.activeOrderForm = 'address';
            console.log('WebLarekPresenter: activeOrderForm установлен в:', this.activeOrderForm);

            // 2. Инициализируем валидацию для новой формы (адрес)
            // Это вызовет orderForm:validity:changed, который обновит UI кнопки
            this.appData.validateOrder('address');
            console.log('WebLarekPresenter: Инициирована валидация для формы адреса.');

            // 3. Рендерим форму адреса в модальном окне
            this.modal.render({
                content: this.orderFormAddress.render({
                    address: this.appData.order.address,
                    payment: this.appData.order.payment,
                    // 'valid' и 'errors' будут установлены позже через событие 'orderForm:validity:changed'
                })
            });
            console.log('WebLarekPresenter: Форма адреса отображена в модальном окне.');
        });

        // ИЗМЕНЕНО: Слушаем 'formField:changed' для всех полей формы адреса
        this.events.on('formField:changed', (data: { field: keyof IOrderForm, value: string }) => {
            console.log(`WebLarekPresenter: Получено "formField:changed". Поле: '${data.field}', Значение: '${data.value}'.`);
            this.appData.setOrderField(data.field, data.value);
            // --- ОБНОВЛЕНО: Используем активную форму для валидации ---
            this.validateActiveOrderForm(); // <-- Использование нового метода
        });

        // ИЗМЕНЕНО: Слушаем 'order:payment:changed' для метода оплаты
        this.events.on('order:payment:changed', (data: { method: 'card' | 'cash' }) => {
            console.log(`WebLarekPresenter: Получено "order:payment:changed". Метод: '${data.method}'.`);
            this.appData.setPaymentMethod(data.method);
            // --- ОБНОВЛЕНО: Используем активную форму для валидации ---
            this.validateActiveOrderForm(); // <-- Использование нового метода
        });

        this.events.on('order:submit', () => {
            console.log('WebLarekPresenter: Получено "order:submit". Попытка перехода к следующему шагу.');
            // ИЗМЕНЕНО: Валидируем форму адреса перед переходом
            if (this.appData.validateOrder('address')) {
                console.log('WebLarekPresenter: Форма адреса валидна. Переход к форме контактов.');
                // --- ОБНОВЛЕНО: Меняем активную форму ---
                this.activeOrderForm = 'contacts'; // <-- Устанавливаем activeOrderForm для следующей формы
                this.modal.render({
                    content: this.orderFormContacts.render({
                        email: this.appData.order.email,
                        phone: this.appData.order.phone,
                        // valid и errors будут установлены через 'orderForm:validity:changed'
                    })
                });
                // ДОБАВЛЕНО: Валидируем форму контактов сразу после открытия, чтобы установить начальное состояние кнопки
                this.appData.validateOrder('contacts');
                console.log('WebLarekPresenter: Форма контактов отображена в модальном окне.');
            } else {
                console.warn('WebLarekPresenter: Форма адреса невалидна. Остаемся на первом шаге.');
            }
        });

        // --- 4.4. Order Form Events (Step 2: Contacts) ---
        // ИЗМЕНЕНО: Слушаем 'contacts:field:change' для всех полей формы контактов
        this.events.on('contacts:field:change', (data: { field: keyof IOrderForm, value: string }) => {
             console.log(`WebLarekPresenter: Получено "contacts:field:change". Поле: '${data.field}', Значение: '${data.value}'.`);
             this.appData.setOrderField(data.field, data.value);
             // --- ОБНОВЛЕНО: Используем активную форму для валидации ---
             this.validateActiveOrderForm(); // <-- Использование нового метода
        });

        this.events.on('contacts:submit', async () => {
            console.log('WebLarekPresenter: Получено "contacts:submit". Попытка отправить заказ.');
            // ИЗМЕНЕНО: Валидируем форму контактов перед отправкой
            if (this.appData.validateOrder('contacts')) {
                try {
                    console.log('WebLarekPresenter: Форма контактов валидна. Отправка заказа...');
                    const orderResult: IOrderResult = await this.api.postOrder(this.appData.order);

                    this.modal.render({ content: this.successView.render({ total: orderResult.total }) });
                    console.log('WebLarekPresenter: Заказ успешно отправлен. Результат:', orderResult);

                    this.cartService.clearCart();
                    this.appData.resetOrder();
                    this.page.counter = 0;
                    this.updateCatalogCards();
                    // --- ОБНОВЛЕНО: Сбрасываем activeOrderForm после успешного заказа ---
                    this.activeOrderForm = null;
                    console.log('WebLarekPresenter: Корзина, заказ и счетчик очищены.');
                } catch (error) {
                    console.error('WebLarekPresenter: Ошибка при оформлении заказа:', error);
                    alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
                }
            } else {
                console.warn('WebLarekPresenter: Форма контактов невалидна. Остаемся на втором шаге.');
            }
        });

        // --- 4.5. Modal and Form Validation Events ---
        // ДОБАВЛЕНО/ИСПРАВЛЕНО: Централизованная обработка валидности формы и ошибок
        this.events.on('orderForm:validity:changed', (data: { isValid: boolean, errors: IFormErrors }) => {
            console.log(`WebLarekPresenter: Получено "orderForm:validity:changed". Валидно: ${data.isValid}, Ошибки:`, data.errors);
            console.log('WebLarekPresenter: Текущая активная форма для рендеринга:', this.activeOrderForm); // Добавил лог для отладки

            // --- ОБНОВЛЕНО: Используем activeOrderForm для рендеринга ---
            if (this.activeOrderForm === 'address') {
                this.orderFormAddress.render({
                    valid: data.isValid,
                    errors: data.errors,
                    // address и payment уже будут в AppData, поэтому их тут можно не передавать
                });
                console.log('WebLarekPresenter: Обновлен OrderFormAddress (валидность/ошибки).');
            } else if (this.activeOrderForm === 'contacts') {
                this.orderFormContacts.render({
                    valid: data.isValid,
                    errors: data.errors,
                    // email и phone уже будут в AppData
                });
                console.log('WebLarekPresenter: Обновлен OrderFormContacts (валидность/ошибки).');
            } else {
                console.warn('WebLarekPresenter: Получено "orderForm:validity:changed", но activeOrderForm не установлен или не соответствует ни одной форме. UI не обновлен.');
            }
        });

        this.events.on('modal:open', () => {
            this.page.locked = true;
            console.log('WebLarekPresenter: Получено "modal:open". Блокировка страницы.');
        });

        this.events.on('modal:close', () => {
            this.page.locked = false;
            this.appData.setPreview(null);
            this.appData.resetOrder();
            // --- ОБНОВЛЕНО: Сбрасываем activeOrderForm при закрытии модального окна ---
            this.activeOrderForm = null;
            console.log('WebLarekPresenter: Получено "modal:close". Active form reset to:', this.activeOrderForm);
        });

        this.events.on('success:close', () => {
            this.modal.close();
            console.log('WebLarekPresenter: Получено "success:close". Закрытие модального окна.');
        });

        // --- Initial Load ---
        this.api.getProducts()
            .then(data => {
                this.appData.setCatalog(data);
                console.log('WebLarekPresenter: Каталог товаров загружен из API.');
            })
            .catch(err => {
                console.error('WebLarekPresenter: Ошибка загрузки каталога:', err);
            });
    } // <-- КОНЕЦ КОНСТРУКТОРА

    protected renderCatalogItems(items: IProduct[]) {
        const fragment = document.createDocumentFragment();
        console.log(`WebLarekPresenter: Начинается рендеринг ${items.length} товаров каталога.`);

        items.forEach(item => {
            const card = new Card(this.cardCatalogTemplate, this.events, {
                onClick: () => this.events.emit('card:select', { id: item.id }),
                onButtonClick: () => {
                    if (this.cartService.isProductInCart(item.id)) {
                        this.events.emit('product:remove', { id: item.id });
                    } else {
                        this.events.emit('product:add', item);
                    }
                }
            });
            fragment.append(card.render({
                ...item,
                buttonText: item.price === null ? 'Бесценно' : (this.cartService.isProductInCart(item.id) ? 'Удалить из корзины' : 'В корзину'),
                buttonDisabled: item.price === null,
                description: undefined,
                index: undefined
            }));
        });
        this.page.catalog = Array.from(fragment.children) as HTMLElement[];
        console.log('WebLarekPresenter: Рендеринг каталога завершен. Элементы добавлены на страницу.');
    }

    protected updateBasketView() {
        console.log('WebLarekPresenter: Обновление представления корзины.');
        const basketItems = this.cartService.getCartItems();
        const basketElements = basketItems.map((item, index) => {
            const card = new Card(this.basketItemTemplate, this.events, {
                onButtonClick: () => this.events.emit('product:remove', { id: item.id })
            });

            const cardData: ICardData = {
                ...item,
                index: index + 1,
                buttonText: 'Удалить',
                buttonDisabled: false,
                description: undefined
            };
            return card.render(cardData);
        });

        const isBasketEmpty = basketItems.length === 0;
        this.basketView.render({
            items: basketElements,
            total: this.cartService.getCartTotal(),
            buttonDisabled: isBasketEmpty,
            buttonText: isBasketEmpty ? 'Корзина пуста' : 'Оформить'
        });
        console.log(`WebLarekPresenter: Представление корзины обновлено. ${basketItems.length} товаров, общая сумма ${this.cartService.getCartTotal()}.`);
    }

    protected updateCatalogCards() {
        console.log('WebLarekPresenter: Обновление карточек каталога (для актуализации состояния кнопок корзины).');
        this.renderCatalogItems(this.appData.catalog);
    }

    // --- ВОТ СЮДА НУЖНО ВСТАВИТЬ МЕТОД validateActiveOrderForm ---
    // Это место после всех существующих методов, но ПЕРЕД последней закрывающейся скобкой класса.
    protected validateActiveOrderForm() {
        if (this.activeOrderForm) {
            console.log(`WebLarekPresenter: Вызов validateOrder для активной формы: ${this.activeOrderForm}.`);
            this.appData.validateOrder(this.activeOrderForm);
        } else {
            console.warn('WebLarekPresenter: Попытка валидировать форму, но activeOrderForm не установлен.');
        }
    }

} // <--- ВОТ ЭТА ЗАКРЫВАЮЩАЯ СКОБКА - КОНЕЦ КЛАССА