// src/classes/view/Modal.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';

interface IModal {
    content: HTMLElement | null; // Может быть null, когда очищается
    open(): void;
    close(): void;
}

export class Modal extends Component<IModal> implements IModal {
    protected _closeButton: HTMLButtonElement;
    protected _content: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container);

        this._closeButton = this._element.querySelector('.modal__close')!;
        this._content = this._element.querySelector('.modal__content')!;

        this._closeButton.addEventListener('click', this.close.bind(this));

        this._element.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) {
                this.close();
            }
        });
    }

    set content(value: HTMLElement | null) {
        if (this._content) {
            this._content.replaceChildren();
            if (value) {
                this._content.append(value);
            }
        }
    }

    open(): void {
        this.toggleClass(this._element, 'modal_active', true);
        this.events.emit('modal:open');
    }

    close(): void {
        this.toggleClass(this._element, 'modal_active', false);
        this.content = null; // Очищаем содержимое при закрытии
        this.events.emit('modal:close');
    }

    render(data: { content: HTMLElement | null }): HTMLElement { // content может быть null при инициализации
        this.content = data.content;
        this.open();
        return this._element;
    }
}