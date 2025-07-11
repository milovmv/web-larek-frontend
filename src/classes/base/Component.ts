// src/base/Component.ts

export abstract class Component<T> {
    // Защищенное поле, содержащее корневой DOM-элемент компонента.
    // Оно будет доступно в дочерних классах.
    protected _element: HTMLElement;

    constructor(container: HTMLElement | HTMLTemplateElement) {
        // Если передан шаблон, клонируем его содержимое.
        if (container instanceof HTMLTemplateElement) {
            this._element = container.content.firstElementChild?.cloneNode(true) as HTMLElement;
        } else {
            // Иначе используем переданный HTML-элемент напрямую.
            this._element = container;
        }

        if (!this._element) {
            throw new Error('Component container element not found or invalid.');
        }
    }

    protected setText(element: HTMLElement, value: string | number): void {
        if (element) {
            element.textContent = String(value);
        }
    }

    protected setHidden(element: HTMLElement, state: boolean): void {
        if (element) {
            element.classList.toggle('hidden', state);
        }
    }

    protected setDisabled(element: HTMLElement, state: boolean): void {
        if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
            element.disabled = state;
        }
    }

    protected setImage(element: HTMLImageElement, src: string, alt: string = ''): void {
        if (element) {
            element.src = src;
            element.alt = alt;
        }
    }

    protected toggleClass(element: HTMLElement, className: string, force?: boolean): void {
        if (element) {
            element.classList.toggle(className, force);
        }
    }

    render(data?: T): HTMLElement {
        return this._element;
    }
}