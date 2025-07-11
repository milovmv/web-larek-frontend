import { IOrderForm } from '../types/types'; 

export type FormFieldName = keyof IOrderForm;

export interface IOrderFieldChangeEvent {

    field: FormFieldName;
    value: string;
}