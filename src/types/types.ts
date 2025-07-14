// src/types/types.ts 
export interface IProduct {
  id: string;
  title: string;
  description?: string;
  price: number | null; // Разрешаем null для "бесценно"
  category: string;
  image: string;
}

export interface IOrderForm {
  payment: string;
  address: string;
  email: string;
  phone: string;
  items: string[];
  total: number;
}

export interface IOrder extends IOrderForm {}

export interface IOrderResult {
id: string;
total: number;
}

export interface IAppState {
catalog: IProduct[];
basket: IProduct[];
order: IOrderForm;
preview: string | null;
formErrors: IFormErrors;
}

export interface IFormErrors {
address?: string;
payment?: string;
email?: string;
phone?: string;
}