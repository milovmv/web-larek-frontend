// src/larekApi.ts

import { Api } from './classes/base/Api'; 
import { IProduct, IOrderResult, IOrder } from './types/types'; 

export interface ILarekApi {
    getProducts(): Promise<IProduct[]>;
    postOrder(order: IOrder): Promise<IOrderResult>;
}

// Предоставляет методы для получения товаров и отправки заказов.
export class LarekApi extends Api implements ILarekApi {
    readonly cdn: string; // CDN-путь для изображений

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options); // Вызываем конструктор базового класса Api
        this.cdn = cdn;
    }

    // Получает список всех товаров из API.
    getProducts(): Promise<IProduct[]> {
        return this.get<{ items: IProduct[] }>('/products')
            .then((data) => {
                return data.items; // Возвращаем только массив товаров
            });
    }

    // Отправляет данные заказа на сервер.
    postOrder(order: IOrder): Promise<IOrderResult> {
        // Создаем новый объект с данными для отправки
        const orderData = {
            payment: order.payment,
            address: order.address,
            email: order.email,
            phone: order.phone,
            items: order.items, // Это массив ID товаров
            total: order.total
        };
        return this.post<IOrderResult>('/order', orderData);
    }
}