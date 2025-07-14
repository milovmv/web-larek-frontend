import { IOrderForm } from '../types/types';

export type FormFieldName = 'payment' | 'address' | 'email' | 'phone'; // Уточнил тип

export interface IOrderFieldChangeEvent {
    field: FormFieldName;
    value: string;
}