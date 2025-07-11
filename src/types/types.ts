// src/types/index.ts
export interface IProduct {
    id: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    image: string;
  }

  export interface IOrderForm {
    // Данные из первой формы (OrderFormAddress)
    payment: string; 
    address: string; 

    // Данные из второй формы (OrderFormContacts)
    email: string;  
    phone: string;  

    // Данные о товарах в корзине
    // Это массив ID товаров, которые находятся в корзине
    items: string[]; 

    // Общая стоимость заказа
    total: number;
}

export interface IOrder extends IOrderForm {}

export interface IOrderResult {
  id: string;
  total: number;
}

export interface IAppState {
  catalog: IProduct[];      // Текущий каталог товаров
  basket: IProduct[];       // Товары, находящиеся в корзине
  order: IOrderForm;        // Данные текущего заказа
  preview: string | null;   // ID товара, который сейчас находится в режиме предпросмотра (или null)
  formErrors: IFormErrors;  // Ошибки валидации форм
}

export interface IFormErrors {
  address?: string;
  payment?: string;
  email?: string;
  phone?: string;
}