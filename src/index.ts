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
const modal = new Modal(document.getElementById('modal-container')!, events);

// Получаем шаблоны для форм и карточек
const productCardTemplate = document.getElementById('card-catalog') as HTMLTemplateElement;
const productPreviewTemplate = document.getElementById('card-preview') as HTMLTemplateElement;
const basketTemplate = document.getElementById('basket') as HTMLTemplateElement;
const basketItemTemplate = document.getElementById('card-basket') as HTMLTemplateElement;
const orderAddressTemplate = document.getElementById('order') as HTMLTemplateElement;
const orderContactsTemplate = document.getElementById('contacts') as HTMLTemplateElement;
const successTemplate = document.getElementById('success') as HTMLTemplateElement;

// Создаем экземпляры форм и представлений на основе шаблонов
const basket = new BasketView(basketTemplate.content.firstElementChild as HTMLElement, events);
const orderFormAddress = new OrderFormAddress(orderAddressTemplate.content.firstElementChild as HTMLElement, events);
const orderFormContacts = new OrderFormContacts(orderContactsTemplate.content.firstElementChild as HTMLElement, events);
const successView = new SuccessView(successTemplate.content.firstElementChild as HTMLElement, events);


// --- Инициализация презентера ---
// Создаем экземпляр презентера и передаем ему все необходимые зависимости
const presenter = new WebLarekPresenter(
    events,
    api,
    appData,
    cartService,
    page,
    modal,
    basket,
    orderFormAddress,
    orderFormContacts,
    successView,
    productCardTemplate,
    productPreviewTemplate,
    basketItemTemplate,
    Card // Передаем класс Card, т.к. презентер его использует для создания элементов
);

// --- ГЛАВНЫЙ ЗАПРОС: ЗАГРУЗКА КАТАЛОГА ТОВАРОВ ПРИ ЗАПУСКЕ ---
api.getProducts()
    .then((items: IProduct[]) => {
        appData.setCatalog(items);
    })
    .catch(err => {
        console.error('Ошибка загрузки каталога:', err);
    });