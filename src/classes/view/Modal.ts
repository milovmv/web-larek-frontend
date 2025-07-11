// src/views/Modal.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter'; 

// Интерфейс для взаимодействия с модальным окном
interface IModal {
    content: HTMLElement; // Элемент, который будет вставлен в модальное окно
    open(): void; // Метод для открытия модального окна
    close(): void; // Метод для закрытия модального окна
}

export class Modal extends Component<IModal> implements IModal {
    protected _closeButton: HTMLButtonElement; // Кнопка закрытия модального окна
    protected _content: HTMLElement; // Контейнер для динамического контента

    // Важно: Теперь принимаем EventEmitter в конструкторе
    constructor(container: HTMLElement, protected events: EventEmitter) {
        // Конструктор Component ожидает HTMLElement или HTMLTemplateElement.
        // Здесь мы передаем уже существующий элемент #modal-container.
        super(container);

        // Получаем ссылки на внутренние элементы модального окна
        this._closeButton = this._element.querySelector('.modal__close');
        this._content = this._element.querySelector('.modal__content');

        // Обработчики событий для закрытия модального окна
        if (this._closeButton) {
            this._closeButton.addEventListener('click', this.close.bind(this));
        }

        // Закрытие по клику на оверлей
        this._element.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) { // Если клик был именно по фону модального окна
                this.close();
            }
        });
    }

    // Сеттер для установки содержимого модального окна
    set content(value: HTMLElement | null) { // Может быть null при очистке
        if (this._content) {
            // Очищаем текущее содержимое перед вставкой нового
            this._content.replaceChildren(); // Очищаем полностью
            if (value) {
                this._content.append(value); // Вставляем новое, если оно есть
            }
        }
    }

    open(): void {
        this.toggleClass(this._element, 'modal_active', true); // Добавляем класс для отображения
        this.events.emit('modal:open'); // Эмитируем событие открытия
    }

    close(): void {
        this.toggleClass(this._element, 'modal_active', false); // Удаляем класс для скрытия
        this.content = null; // Очищаем содержимое при закрытии
        this.events.emit('modal:close'); // Эмитируем событие закрытия
    }

    render(data: { content: HTMLElement }): HTMLElement {
        this.content = data.content; // Устанавливаем содержимое
        this.open(); // Открываем модальное окно
        return this._element;
    }
}