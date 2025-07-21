// src/index.ts

import './scss/styles.scss';

import { API_URL, CDN_URL } from './utils/constants';

import { LarekApi } from './larekApi';
import { EventEmitter } from './classes/base/EventEmitter';
import { AppData } from './classes/model/AppData';
import { CartService } from './classes/model/CartService';
import { WebLarekPresenter } from './classes/presenter/WebLarekPresenter';
import { Page } from './classes/view/Page';
import { Modal } from './classes/view/Modal';
import { BasketView } from './classes/view/BasketView';
import { OrderFormAddress } from './classes/view/OrderFormAddress';
import { OrderFormContacts } from './classes/view/OrderFormContacts';
import { SuccessView } from './classes/view/SuccessView';
import { Card } from './classes/view/Card'; // Добавил импорт Card, т.к. он нужен презентеру для создания карточек

import { IProduct } from './types/types';


// --- Инициализация базовых элементов ---
const events = new EventEmitter();
const api = new LarekApi(CDN_URL, API_URL);

// --- Инициализация моделей ---
const appData = new AppData(events);
const cartService = new CartService(appData, events);

// --- Инициализация представлений (UI-компонентов) ---
const page = new Page(document.body, events);
// !!! Модальное окно должно быть div-контейнером, а не шаблоном. Это верно.
const modal = new Modal(document.getElementById('modal-container')!, events);

// Получаем ШАБЛОНЫ
const productCardTemplate = document.getElementById('card-catalog') as HTMLTemplateElement;
const productPreviewTemplate = document.getElementById('card-preview') as HTMLTemplateElement;
const basketTemplate = document.getElementById('basket') as HTMLTemplateElement;
const basketItemTemplate = document.getElementById('card-basket') as HTMLTemplateElement;
const orderAddressTemplate = document.getElementById('order') as HTMLTemplateElement;
const orderContactsTemplate = document.getElementById('contacts') as HTMLTemplateElement;
const successTemplate = document.getElementById('success') as HTMLTemplateElement;

// Проверка наличия шаблонов (очень важно для отладки!)
if (!productCardTemplate) console.error('Ошибка: Шаблон #card-catalog не найден!');
if (!productPreviewTemplate) console.error('Ошибка: Шаблон #card-preview не найден!');
if (!basketTemplate) console.error('Ошибка: Шаблон #basket не найден!');
if (!basketItemTemplate) console.error('Ошибка: Шаблон #card-basket не найден!');
if (!orderAddressTemplate) console.error('Ошибка: Шаблон #order не найден!');
if (!orderContactsTemplate) console.error('Ошибка: Шаблон #contacts не найден!');
if (!successTemplate) console.error('Ошибка: Шаблон #success не найден!');


// Создаем экземпляры форм и представлений, ПЕРЕДАВАЯ ИМ САМИ ШАБЛОНЫ.
// Это позволит им (через Component) клонировать шаблон каждый раз, когда это нужно.
const basket = new BasketView(basketTemplate, events);
const orderFormAddress = new OrderFormAddress(orderAddressTemplate, events);
const orderFormContacts = new OrderFormContacts(orderContactsTemplate, events);
const successView = new SuccessView(successTemplate, events);


// --- Инициализация презентера ---
const presenter = new WebLarekPresenter(
    events,
    api,
    appData,
    cartService,
    page,
    modal,
    basket, // Экземпляр BasketView (теперь он правильно обрабатывает свой шаблон)
    orderFormAddress,
    orderFormContacts,
    successView,
    productCardTemplate, // Шаблон для каталожных карточек
    productPreviewTemplate, // Шаблон для предпросмотра
    basketItemTemplate,   // Шаблон для элементов корзины
);

// --- ГЛАВНЫЙ ЗАПРОС: ЗАГРУЗКА КАТАЛОГА ТОВАРОВ ПРИ ЗАПУСКЕ ---
api.getProducts()
    .then((items: IProduct[]) => {
        if (items.length === 0) {
        }
        appData.setCatalog(items);
    })
    .catch(err => {
        console.error('Ошибка загрузки каталога:', err);
    });

// Обработчик открытия корзины
document.querySelector('.header__basket')?.addEventListener('click', () => {
    events.emit('basket:open');
});