// src/classes/view/Card.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IProduct } from '../../types/types'; // Убедитесь, что ваш IProduct корректен

// Интерфейс для данных, которые Card может отображать
// Расширяет IProduct, добавляя специфичные для UI поля
export interface ICardData extends IProduct {
    index?: number; // Для нумерации в корзине
    description?: string; // Для подробного описания в предпросмотре
    buttonText?: string; // Текст на кнопке (например, "В корзину", "Удалить")
    buttonDisabled?: boolean; // Состояние активности кнопки
}

// Интерфейс для действий, которые можно привязать к Card
export interface ICardActions {
    onClick?: (event: MouseEvent) => void; // Общий клик по карточке
    onButtonClick?: (event: MouseEvent) => void; // Клик по основной кнопке
    onDeleteClick?: (event: MouseEvent) => void; // Клик по кнопке удаления в корзине
}

// Класс Card для отображения товаров в различных контекстах
export class Card extends Component<ICardData> {
    // Свойства для элементов DOM. Объявляем их как "могут быть null",
    // потому что не все элементы будут присутствовать во всех шаблонах.
    protected _title: HTMLElement | null;
    protected _image: HTMLImageElement | null;
    protected _price: HTMLElement | null;
    protected _category: HTMLElement | null;
    protected _description: HTMLElement | null;
    protected _button: HTMLButtonElement | null;
    protected _index: HTMLElement | null; // Элемент для номера в корзине
    protected _deleteButton: HTMLButtonElement | null; // Кнопка удаления для элементов корзины

    // Конструктор принимает HTMLTemplateElement (или HTMLElement) и EventEmitter.
    // actions теперь опциональны и содержат функции обратного вызова.
    constructor(container: HTMLElement | HTMLTemplateElement, protected events: EventEmitter, actions?: ICardActions) {
        super(container); // Базовый Component уже клонирует содержимое шаблона

        // Инициализируем свойства DOM-элементов.
        // Используем querySelector и приводим к конкретным типам.
        // Если элемент не найден, свойство останется null.
        this._title = this._element.querySelector('.card__title');
        this._image = this._element.querySelector('.card__image');
        this._price = this._element.querySelector('.card__price');
        this._category = this._element.querySelector('.card__category');
        this._description = this._element.querySelector('.card__text');
        this._index = this._element.querySelector('.basket__item-index');
        this._deleteButton = this._element.querySelector('.basket__item-delete');

        // Поиск основной кнопки: сначала .card__button, если не найдена, то просто .button
        this._button = this._element.querySelector('.card__button') as HTMLButtonElement || 
                       this._element.querySelector('.button') as HTMLButtonElement || 
                       null; // Если ни одна не найдена, останется null

        // Привязка обработчиков событий
        // Общий клик по карточке (например, для открытия предпросмотра)
        if (actions?.onClick) {
            this._element.addEventListener('click', actions.onClick);
        }

        // Клик по основной кнопке (например, "В корзину", "Купить")
        if (actions?.onButtonClick && this._button) {
            this._button.addEventListener('click', actions.onButtonClick);
        }

        // Клик по кнопке удаления (для элементов корзины)
        if (actions?.onDeleteClick && this._deleteButton) {
            this._deleteButton.addEventListener('click', actions.onDeleteClick);
        }
    }

    // --- Сеттеры для данных ---
    // Каждый сеттер проверяет, существует ли соответствующий DOM-элемент,
    // прежде чем пытаться им манипулировать. Это предотвращает ошибки 'null'.

    set id(value: string) {
        this._element.dataset.id = value;
    }

    get id(): string {
        return this._element.dataset.id || '';
    }

    set title(value: string) {
        if (this._title) {
            this.setText(this._title, value);
        }
        // Убраны console.warn, так как теперь Card гибкий к отсутствию элементов.
        // Логи могут быть добавлены в презентере, если нужно отследить отсутствие
        // критически важных для конкретного шаблона элементов.
    }

    set image(value: string) {
        if (this._image) {
            this.setImage(this._image, value, this.title);
        }
    }

    set price(value: number | null) {
        if (this._price) {
            if (value === null) {
                this.setText(this._price, 'Бесценно');
            } else {
                this.setText(this._price, `${value} синапсов`);
            }
        }
        // Логика состояния кнопки (disabled) и текста кнопки перенесена в render
        // или должна управляться презентером напрямую через buttonText/buttonDisabled.
    }

    set category(value: string) {
        if (this._category) {
            this.setText(this._category, value);
            // Перед добавлением нового класса, удаляем старые классы категорий,
            // чтобы корректно отображать разные категории.
            // Примечание: предполагается, что getCategoryClass возвращает ТОЛЬКО класс цвета.
            const newCategoryClass = this.getCategoryClass(value);
            
            // Удаляем все предыдущие классы, начинающиеся с 'card__category_'
            Array.from(this._category.classList).forEach(cls => {
                if (cls.startsWith('card__category_') && cls !== 'card__category') {
                    this._category?.classList.remove(cls);
                }
            });

            if (newCategoryClass) {
                this.toggleClass(this._category, newCategoryClass, true); // Добавляем новый класс
            }
        }
    }

    set description(value: string | undefined) {
        if (this._description) {
            // Если значение undefined или пустая строка, скрываем элемент.
            this.setText(this._description, value || '');
            this.setHidden(this._description, !value);
        }
    }

    set index(value: number | undefined) {
        if (this._index) {
            // Если значение undefined, скрываем элемент, иначе отображаем номер.
            this.setText(this._index, String(value || ''));
            this.setHidden(this._index, value === undefined);
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

    // --- Метод render для обновления представления карточки ---
    // Этот метод вызывается презентером для обновления Card данными.
    // Он безопасно устанавливает свойства, проверяя их наличие.
    public render(data?: ICardData): HTMLElement {
        if (data) {
            // Установка обязательных полей
            if (data.id !== undefined) this.id = data.id;
            if (data.title !== undefined) this.title = data.title;
            if (data.price !== undefined) this.price = data.price;

            // Установка опциональных полей (только если они переданы)
            if (data.image !== undefined) this.image = data.image;
            if (data.category !== undefined) this.category = data.category;
            if (data.description !== undefined) this.description = data.description;
            if (data.index !== undefined) this.index = data.index;

            // Логика кнопки: если buttonText передан, используем его.
            // Иначе, если цена null, текст "Недоступно", в противном случае "В корзину".
            if (data.buttonText !== undefined) {
                this.buttonText = data.buttonText;
            } else if (this._button) { // Только если кнопка существует в этом шаблоне
                this.buttonText = data.price === null ? 'Недоступно' : 'В корзину';
            }

            // Логика активности кнопки: если buttonDisabled передан, используем его.
            // Иначе, если цена null, кнопка отключается.
            if (data.buttonDisabled !== undefined) {
                this.buttonDisabled = data.buttonDisabled;
            } else { // Если buttonDisabled не передан, выводим из цены
                this.buttonDisabled = data.price === null;
            }
        } else {
            console.warn('Card: render called without data.'); // Предупреждение, если данные не переданы
        }

        return this._element; // Возвращаем корневой DOM-элемент карточки
    }

    // Вспомогательный метод для получения класса категории
    private getCategoryClass(category: string): string {
        switch (category) {
            case 'софт-скил':
                return 'card__category_soft';
            case 'другое':
                return 'card__category_other';
            case 'хард-скил':
                return 'card__category_hard';
            case 'дополнительное':
                return 'card__category_additional';
            case 'кнопка': // Если у вас есть такая категория, иначе удалите
                return 'card__category_button';
            default:
                // Если категория неизвестна, можно вернуть пустую строку
                // или класс по умолчанию, если он есть.
                console.warn('Card: Unknown category encountered:', category);
                return ''; 
        }
    }
}