// src/larekApi.ts

import { Api } from './classes/base/Api';
import { IProduct, IOrderResult, IOrder } from './types/types';

export interface ILarekApi {
    getProducts(): Promise<IProduct[]>;
    postOrder(order: IOrder): Promise<IOrderResult>;
}

export class LarekApi extends Api implements ILarekApi {
    readonly cdn: string;

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options);
        this.cdn = cdn;
    }

    getProducts(): Promise<IProduct[]> {
        return this.get<{ items: IProduct[] }>('/product')
            .then((data) => {
                return data.items.map(item => ({
                    ...item,
                    image: this.cdn + item.image // Добавляем CDN к пути изображения
                }));
            });
    }

    postOrder(order: IOrder): Promise<IOrderResult> {
        const orderData = {
            payment: order.payment,
            address: order.address,
            email: order.email,
            phone: order.phone,
            items: order.items,
            total: order.total
        };
        return this.post<IOrderResult>('/order', orderData);
    }
}