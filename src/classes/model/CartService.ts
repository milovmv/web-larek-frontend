// src/classes/model/CartService.ts

import { EventEmitter } from '../base/EventEmitter'; 
import { IProduct } from '../../types/types'; 
import { AppData } from './AppData'; 

//Класс-сервис, отвечающий за управление логикой корзины покупок.
export class CartService {
    protected appData: AppData;
    protected events: EventEmitter; 

    constructor(appData: AppData, events: EventEmitter) {
        this.appData = appData;
        this.events = events; 
    }
    //Добавляет товар в корзину через AppData.
    addToCart(product: IProduct): void {
        this.appData.addToBasket(product);
    }

    // Удаляет товар из корзины через AppData.
    removeFromCart(productId: string): void {
        this.appData.removeFromBasket(productId);
    }

    // Получает текущий список товаров в корзине из AppData.
    getCartItems(): IProduct[] {
        return this.appData.getBasketItems();
    }

    // Получает общую стоимость товаров в корзине из AppData.
    getCartTotal(): number {
        return this.appData.getBasketTotal();
    }

    // Очищает все товары из корзины через AppData.
    clearCart(): void {
        this.appData.clearBasket();
    }

    // Получает количество уникальных товаров в корзине.
    getCartItemCount(): number {
        return this.appData.getBasketItems().length;
    }
}