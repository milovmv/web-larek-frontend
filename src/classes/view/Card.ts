// src/classes/view/Card.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IProduct } from '../../types/types';

export interface ICardData extends IProduct {
    index?: number;
    description?: string;
    buttonText?: string;
    buttonDisabled?: boolean;
}

export interface ICardActions {
    onClick?: (event: MouseEvent) => void;
    onButtonClick?: (event: MouseEvent) => void;
}

export class Card extends Component<ICardData> {
    protected _title: HTMLElement;
    protected _image: HTMLImageElement;
    protected _price: HTMLElement;
    protected _category?: HTMLElement;
    protected _description?: HTMLElement;
    protected _button?: HTMLButtonElement;
    protected _index?: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter, actions?: ICardActions) {
        super(container);

        this._title = this._element.querySelector('.card__title')!;
        this._image = this._element.querySelector('.card__image')!;
        this._price = this._element.querySelector('.card__price')!;
        this._category = this._element.querySelector('.card__category');
        this._description = this._element.querySelector('.card__text');
        // Селекторы для кнопки: сначала card__button, если нет, то button.
        // Это позволяет использовать одну Card для разных шаблонов (каталог, предпросмотр, корзина)
        this._button = this._element.querySelector('.card__button') || this._element.querySelector('.button') as HTMLButtonElement;
        this._index = this._element.querySelector('.basket__item-index');

        if (actions?.onClick) {
            this._element.addEventListener('click', actions.onClick);
        }
        if (actions?.onButtonClick && this._button) {
            this._button.addEventListener('click', actions.onButtonClick);
        }
    }

    set id(value: string) {
        this._element.dataset.id = value;
    }

    get id(): string {
        return this._element.dataset.id || '';
    }

    set title(value: string) {
        this.setText(this._title, value);
    }

    set image(value: string) {
        this.setImage(this._image, value, this.title);
    }

    set price(value: number | null) {
        if (value === null) {
            this.setText(this._price, 'Бесценно');
            // Если цена бесценна, отключаем кнопку, если она не 'Удалить'
            if (this._button && this._button.textContent !== 'Удалить') {
                this.setDisabled(this._button, true);
            }
        } else {
            this.setText(this._price, `${value} синапсов`);
            // Если цена есть, и кнопка не 'Удалить', включаем ее
            if (this._button && this._button.textContent !== 'Удалить') {
                this.setDisabled(this._button, false);
            }
        }
    }

    set category(value: string) {
        if (this._category) {
            this.setText(this._category, value);
            this._category.className = 'card__category'; // Сброс до базового класса
            this.toggleClass(this._category, this.getCategoryClass(value), true);
        }
    }

    set description(value: string | undefined) {
        if (this._description) {
            this.setText(this._description, value || '');
            this.setHidden(this._description, !value); // Скрываем, если нет текста
        }
    }

    set index(value: number | undefined) {
        if (this._index) {
            this.setText(this._index, String(value || ''));
            this.setHidden(this._index, value === undefined); // Скрываем, если нет индекса
        }
    }

    set buttonText(value: string | undefined) {
        if (this._button) {
            this.setText(this._button, value || '');
        }
    }

    set buttonDisabled(state: boolean) {
        if (this._button) {
            this.setDisabled(this._button, state);
        }
    }

    render(data: ICardData): HTMLElement {
        this.id = data.id;
        this.title = data.title;
        this.image = data.image;
        this.price = data.price; // Сеттер price уже обрабатывает "Бесценно" и состояние кнопки

        // Опциональные поля
        if (data.category) this.category = data.category;
        this.description = data.description; // Сеттер уже управляет видимостью
        this.index = data.index; // Сеттер уже управляет видимостью

        // Логика кнопки
        if (data.buttonText !== undefined) {
            this.buttonText = data.buttonText;
        } else if (this._button) {
            // Если buttonText не передан, установим его по умолчанию
            this.buttonText = data.price === null ? 'Недоступно' : 'В корзину';
        }

        if (data.buttonDisabled !== undefined) {
            this.buttonDisabled = data.buttonDisabled;
        } else if (this._button && this._button.textContent !== 'Удалить') {
            // Если не задано явно, и это не кнопка "Удалить", то зависит от цены
            this.buttonDisabled = data.price === null;
        }


        return this._element;
    }

    private getCategoryClass(category: string): string {
        switch (category) {
            case 'софт-скилл':
                return 'card__category_soft';
            case 'другое':
                return 'card__category_other';
            case 'хард-скилл':
                return 'card__category_hard';
            case 'дополнительное':
                return 'card__category_additional';
            case 'кнопка': // Этого класса нет в вашей верстке, но если понадобится
                return 'card__category_button';
            default:
                return '';
        }
    }
}