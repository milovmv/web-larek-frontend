// src/views/Card.ts

import { Component } from '../base/Component'; 
import { EventEmitter } from '../base/EventEmitter'; 
import { IProduct } from '../../types/types'; 

// Тип для данных карточки, передаваемых в render.
export interface ICardData extends IProduct { // Расширяем IProduct, чтобы включить базовые поля товара
    index?: number;        // Для карточки в корзине (позиция)
    description?: string;  // Для карточки предпросмотра
    buttonText?: string;   // Текст на кнопке ("В корзину", "Удалить", "Недоступно" и т.д.)
    buttonDisabled?: boolean; // Состояние активности кнопки
}

// Интерфейс для действий, которые можно передать в конструктор Card.
export interface ICardActions {
    onClick?: (event: MouseEvent) => void;      // Клик по всей карточке
    onButtonClick?: (event: MouseEvent) => void; // Клик по кнопке
}

export class Card extends Component<ICardData> {
    protected _title: HTMLElement;
    protected _image: HTMLImageElement;
    protected _price: HTMLElement;
    protected _category?: HTMLElement;
    protected _description?: HTMLElement; 
    protected _button?: HTMLButtonElement; 
    protected _index?: HTMLElement; 

    constructor(container: HTMLTemplateElement, protected events: EventEmitter, actions?: ICardActions) {
        // Предполагаем, что Component принимает HTMLTemplateElement и клонирует его
        super(container); 

        this._title = this._element.querySelector('.card__title')!;
        this._image = this._element.querySelector('.card__image')!;
        this._price = this._element.querySelector('.card__price')!;
        this._category = this._element.querySelector('.card__category'); // Может быть null
        this._description = this._element.querySelector('.card__text'); // Может быть null
        this._button = this._element.querySelector('.card__button') || this._element.querySelector('.button'); 
        this._index = this._element.querySelector('.basket__item-index'); // Может быть null

        // Обработчики событий
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
        // Устанавливаем цену. Если price === null, показываем "Бесценно".
        // Состояние кнопки будет установлено из `data.buttonDisabled` в render().
        if (value === null) {
            this.setText(this._price, 'Бесценно');
        } else {
            this.setText(this._price, `${value} синапсов`);
        }
    }

    set category(value: string) {
        if (this._category) {
            this.setText(this._category, value);
            // Удаляем все предыдущие классы категорий перед добавлением нового
            this._category.className = 'card__category'; // Сброс до базового класса
            this.toggleClass(this._category, this.getCategoryClass(value), true);
        }
    }

    set description(value: string | undefined) { // Используем undefined для опциональности
        if (this._description) {
            this.setText(this._description, value || ''); // Убедимся, что передаем строку
        }
    }

    set index(value: number | undefined) { // Используем undefined для опциональности
        if (this._index) {
            this.setText(this._index, String(value || ''));
        }
    }

    set buttonText(value: string | undefined) { // Используем undefined для опциональности
        if (this._button) {
            this.setText(this._button, value || '');
        }
    }

    set buttonDisabled(state: boolean) {
        if (this._button) {
            this.setDisabled(this._button, state);
        }
    }

    // Рендерит карточку товара, используя предоставленные данные.
    render(data: ICardData): HTMLElement {
        this.id = data.id;
        this.title = data.title;
        this.image = data.image;
        this.price = data.price; // Сеттер price уже обрабатывает "Бесценно"

        // Эти поля опциональны и будут устанавливаться, только если они присутствуют в data.
        if (data.category) {
            this.category = data.category;
        }
        if (data.description) {
            this.description = data.description;
        } else if (this._description) {
            // Если описание не передано, но элемент для него есть, скрываем его или очищаем
            this.setText(this._description, ''); 
            this._description.style.display = 'none'; // Можно также скрыть
        }

        if (data.index !== undefined) {
            this.index = data.index;
        } else if (this._index) {
            this.setText(this._index, '');
            this._index.style.display = 'none';
        }

        if (data.buttonText) {
            this.buttonText = data.buttonText;
        } else if (this._button) {
            // Устанавливаем текст кнопки по умолчанию, если не задан в данных
            this.buttonText = data.price === null ? 'Недоступно' : 'В корзину'; 
        }

        if (data.buttonDisabled !== undefined) {
             this.buttonDisabled = data.buttonDisabled;
        } else if (this._button && data.price === null && this._button.textContent !== 'Удалить') {
             this.buttonDisabled = true; // Отключаем, если бесценно и не "Удалить"
        } else if (this._button && this._button.textContent === 'Удалить') {
            this.buttonDisabled = false; // Кнопка "Удалить" всегда активна
        } else if (this._button) {
            this.buttonDisabled = false; // По умолчанию активна, если цена есть
        }


        return this._element;
    }

    // Вспомогательный метод для определения CSS-класса категории
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
            case 'кнопка':
                return 'card__category_button';
            default:
                return ''; // Если категория не найдена, не добавляем специфичный класс
        }
    }
}