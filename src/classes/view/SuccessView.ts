// src/classes/view/SuccessView.ts

import { Component } from '../base/Component';
import { EventEmitter } from '../base/EventEmitter';
import { IOrderResult } from '../../types/types';

interface ISuccessView {
    total: number;
}

export class SuccessView extends Component<ISuccessView> {
    protected _closeButton: HTMLButtonElement;
    protected _totalDisplay: HTMLElement;

    constructor(container: HTMLElement, protected events: EventEmitter) {
        super(container);

        this._closeButton = this._element.querySelector('.order-success__close')!;
        this._totalDisplay = this._element.querySelector('.order-success__description')!;

        this._closeButton.addEventListener('click', () => {
            this.events.emit('success:close');
        });
    }

    set total(value: number) {
        this.setText(this._totalDisplay, `Списано ${value} синапсов`);
    }

    render(data?: Partial<ISuccessView>): HTMLElement {
        if (data?.total !== undefined) {
            this.total = data.total;
        }
        return this._element;
    }
}