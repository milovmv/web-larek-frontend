// src/classes/presenter/WebLarekPresenter.ts

// Пути к базовым классам: из src/classes/presenter/ нужно подняться до src/classes/
// и потом зайти в base/
import { EventEmitter } from '../base/EventEmitter'; 

// Пути к классам модели: из src/classes/presenter/ нужно подняться до src/classes/
// и потом зайти в model/
import { AppData } from '../model/AppData'; 
import { CartService } from '../model/CartService'; 

// Пути к View-компонентам: из src/classes/presenter/ нужно подняться до src/classes/
// и потом зайти в view/ или common/
import { Page } from '../view/Page';
import { Card, ICardData, ICardActions } from '../view/Card';
import { Modal } from '../view/Modal'; 
import { BasketView } from '../view/BasketView';
import { OrderFormAddress } from '../view/OrderFormAddress';
import { OrderFormContacts } from '../view/OrderFormContacts';
import { SuccessView } from '../view/SuccessView';

// Пути к типам: из src/classes/presenter/ нужно подняться до src/classes/,
// потом еще раз подняться до src/, и затем зайти в types/
import { IProduct, IOrderResult, IFormErrors } from '../../types/types'; 
import { IOrderFieldChangeEvent } from '../../types/events'; 

// Пути к API-сервису и утилитам: из src/classes/presenter/ нужно подняться до src/classes/,
// затем еще раз подняться до src/, и затем зайти в (например) api/ или utils/
import { LarekApi } from '../../larekApi'; // Предполагаем src/larekApi.ts
import { API_URL, CDN_URL } from '../../utils/constants'; // Предполагаем src/utils/constants.ts


/**
 * @class WebLarekPresenter
 * @description Основной класс-презентер, управляющий логикой всего приложения "Веб-Ларек".
 * Связывает View-компоненты, Model (AppData) и сервисы.
 */
export class WebLarekPresenter {
    protected api: LarekApi; 
    protected appData: AppData;
    protected cartService: CartService;
    protected events: EventEmitter;

    // View-компоненты
    protected page: Page;
    protected modal: Modal;
    protected basketView: BasketView;
    protected orderFormAddress: OrderFormAddress;
    protected orderFormContacts: OrderFormContacts;
    protected successView: SuccessView;

    // Шаблоны для создания View-компонентов
    protected cardCatalogTemplate: HTMLTemplateElement;
    protected cardPreviewTemplate: HTMLTemplateElement;
    protected basketTemplate: HTMLTemplateElement;
    protected orderTemplate: HTMLTemplateElement;
    protected contactsTemplate: HTMLTemplateElement;
    protected successTemplate: HTMLTemplateElement;

    constructor() {
        // --- Инициализация базовых классов и API ---
        this.events = new EventEmitter();
        this.api = new LarekApi(CDN_URL, API_URL); 
        this.appData = new AppData(this.events); 
        this.cartService = new CartService(this.appData, this.events); 

        // --- Получение шаблонов (делаем их non-null утверждением !) ---
        this.cardCatalogTemplate = document.querySelector<HTMLTemplateElement>('#card-catalog')!;
        this.cardPreviewTemplate = document.querySelector<HTMLTemplateElement>('#card-preview')!;
        this.basketTemplate = document.querySelector<HTMLTemplateElement>('#basket')!;
        this.orderTemplate = document.querySelector<HTMLTemplateElement>('#order')!;
        this.contactsTemplate = document.querySelector<HTMLTemplateElement>('#contacts')!;
        this.successTemplate = document.querySelector<HTMLTemplateElement>('#success')!;

        // --- Инициализация View-компонентов (также делаем non-null утверждение для элементов) ---
        this.page = new Page(document.body, this.events);
        this.modal = new Modal(document.getElementById('modal-container') as HTMLElement, this.events); 
        this.basketView = new BasketView(this.basketTemplate, this.events);
        this.orderFormAddress = new OrderFormAddress(this.orderTemplate, this.events);
        this.orderFormContacts = new OrderFormContacts(this.contactsTemplate, this.events);
        this.successView = new SuccessView(this.successTemplate, this.events);

        // --- Регистрация глобальных слушателей событий (основная логика Презентера) ---

        // 1. События, связанные с каталогом и карточками
        this.events.on('items:changed', (data: { catalog: IProduct[] }) => {
            this.page.catalog = data.catalog.map(item => {
                // Формируем данные для карточки каталога
                const cardData: ICardData = {
                    ...item, // Копируем все свойства IProduct
                    buttonText: item.price === null ? 'Бесценно' : 'В корзину',
                    buttonDisabled: item.price === null,
                    description: undefined, // Убедимся, что описание не передается для каталога
                    index: undefined
                };

                // Создаем карточку и передаем ей обработчик клика
                const card = new Card(this.cardCatalogTemplate, this.events, {
                    onClick: () => this.events.emit('card:select', { id: item.id })
                });
                return card.render(cardData);
            });
        });

        this.events.on('card:select', (data: { id: string }) => {
            const product = this.appData.getProduct(data.id);
            if (product) {
                this.appData.setPreview(product.id);
                // Формируем данные для карточки предпросмотра
                const cardData: ICardData = {
                    ...product,
                    description: product.description, // Описание есть в предпросмотре
                    buttonText: product.price === null ? 'Бесценно' : 'В корзину',
                    buttonDisabled: product.price === null,
                    index: undefined
                };

                const previewCard = new Card(this.cardPreviewTemplate, this.events, {
                    onButtonClick: () => this.events.emit('preview:addToBasket', { id: product.id })
                });
                this.modal.render({ content: previewCard.render(cardData) });
            }
        });

        // 2. События, связанные с корзиной
        this.events.on('basket:open', () => {
            const basketItems = this.cartService.getCartItems();
            const basketElements = basketItems.map((item, index) => {
                // Формируем данные для карточки в корзине
                const cardData: ICardData = {
                    ...item,
                    index: index + 1, // Индекс элемента в корзине (начинаем с 1)
                    buttonText: 'Удалить',
                    buttonDisabled: false, // Кнопка "Удалить" всегда активна
                    description: undefined // Описание не нужно в корзине
                };

                // Для карточки в корзине используем шаблон каталога или свой шаблон basket-card
                const card = new Card(this.cardCatalogTemplate, this.events, {
                    onButtonClick: () => this.events.emit('basket:removeFromBasket', { id: item.id })
                });
                return card.render(cardData);
            });
            this.modal.render({ content: this.basketView.render({ items: basketElements, total: this.cartService.getCartTotal() }) });
        });

        this.events.on('basket:changed', () => {
            const basketItems = this.cartService.getCartItems();
            const basketElements = basketItems.map((item, index) => {
                const cardData: ICardData = {
                    ...item,
                    index: index + 1,
                    buttonText: 'Удалить',
                    buttonDisabled: false,
                    description: undefined
                };
                const card = new Card(this.cardCatalogTemplate, this.events, {
                    onButtonClick: () => this.events.emit('basket:removeFromBasket', { id: item.id })
                });
                return card.render(cardData);
            });

            // Определяем, должна ли кнопка оформления заказа быть отключена
            const isBasketEmpty = basketItems.length === 0;

            this.basketView.render({
                items: basketElements,
                total: this.cartService.getCartTotal(),
                // 👇 Вот здесь мы передаем состояние кнопки через data
                buttonDisabled: isBasketEmpty, 
                buttonText: isBasketEmpty ? 'Корзина пуста' : 'Оформить заказ' 
            });
            
            this.page.counter = this.cartService.getCartItemCount();
        });




        // 3. События, связанные с формой заказа
        this.events.on('basket:order', () => {
            // Открываем модальное окно с формой первого шага заказа
            this.modal.render({
                content: this.orderFormAddress.render({
                    address: this.appData.order.address,
                    payment: this.appData.order.payment,
                    errors: this.appData.formErrors // Передаем текущие ошибки формы
                })
            });

            this.appData.order.items = this.appData.getBasketItemsIds();
            this.appData.order.total = this.appData.getBasketTotal(); 
        });

        this.events.on('order:addressInput', (data: IOrderFieldChangeEvent) => {
            this.appData.setOrderField(data.field, data.value);
        });

        this.events.on('order:submit', () => {
            // Сначала всегда пытаемся провалидировать форму AppData
            if (this.appData.validateOrder()) { 
                // Если валидация прошла успешно, открываем форму контактов
                this.modal.render({
                    content: this.orderFormContacts.render({
                        // Передаем текущие данные полей и ошибки в форму контактов
                        email: this.appData.order.email,
                        phone: this.appData.order.phone,
                        errors: this.appData.formErrors// Передаем объект IFormErrors
                    })
                });
            } else {
                this.orderFormAddress.errors = this.appData.formErrors; 
            }
        });

        this.events.on('order:contactsInput', (data: IOrderFieldChangeEvent) => {
            this.appData.setOrderField(data.field, data.value);
        });

        this.events.on('formErrors:changed', (errors: IFormErrors) => {
            const { address, payment, email, phone } = errors;
            this.orderFormAddress.errors = errors; 
            this.orderFormAddress.valid = !address && !payment; 
            this.orderFormContacts.errors = errors;
            this.orderFormContacts.valid = !email && !phone; 
        });

        this.events.on('order:success', async () => {
            if (this.appData.validateOrder()) { 
                try {
                    // Если валидация прошла успешно, отправляем заказ на сервер
                    const orderResult: IOrderResult = await this.api.post('/order', this.appData.order);

                    // Показываем модальное окно успешного оформления
                    this.modal.render({ content: this.successView.render({ total: orderResult.total }) });

                    // Очищаем корзину и сбрасываем данные заказа после успешной отправки
                    this.cartService.clearCart(); 
                    this.appData.resetOrder();

                } catch (error) {
                    // В случае ошибки выводим сообщение
                    console.error('Ошибка отправки заказа:', error);
                    alert('Произошла ошибка при оформлении заказа. Попробуйте снова.');
                }
            } else {
                this.orderFormContacts.errors = this.appData.formErrors; 
            }
        });

        // 4. События, связанные с окном успеха
        this.events.on('success:close', () => {
            this.modal.close(); 
        });

        // --- Начальная загрузка данных ---
        this.api.get('/products')
            .then((data: { items: IProduct[] }) => {
                this.appData.setCatalog(data.items); 
            })
            .catch(err => {
                console.error('Ошибка загрузки каталога:', err);
            });
    }
}