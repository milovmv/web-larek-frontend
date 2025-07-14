// src/classes/model/CartService.ts

import { AppData } from './AppData';
import { EventEmitter } from '../base/EventEmitter';
import { IProduct } from '../../types/types';

export class CartService {
    constructor(protected appData: AppData, protected events: EventEmitter) {
        // Конструктор CartService
    }

    addProduct(product: IProduct): void {
        if (!this.isProductInCart(product.id)) {
            this.appData.addToBasket(product);
            this.events.emit('cart:changed');
            console.log(`Товар "${product.title}" добавлен в корзину.`);
        } else {
            console.warn(`Товар "${product.title}" (ID: ${product.id}) уже находится в корзине.`);
        }
    }

    removeProduct(id: string): void {
        if (this.isProductInCart(id)) {
            this.appData.removeFromBasket(id);
            this.events.emit('cart:changed');
            console.log(`Товар с ID ${id} удален из корзины.`);
        } else {
            console.warn(`Товар с ID ${id} не найден в корзине, удаление невозможно.`);
        }
    }

    getCartItems(): IProduct[] {
        return this.appData.getBasketItems();
    }

    getCartTotal(): number {
        return this.appData.getBasketTotal();
    }

    getCartItemCount(): number {
        return this.appData.basket.length;
    }

    clearCart(): void {
        this.appData.clearBasket();
        this.events.emit('cart:changed');
        console.log('Корзина была очищена.');
    }

    isProductInCart(productId: string): boolean {
        return this.appData.basket.some(item => item.id === productId);
    }

    getCartItemsIds(): string[] {
        // Получаем все товары в корзине и преобразуем их в массив только ID
        return this.appData.basket.map(item => item.id);
    }
}