// src/classes/base/api.ts

export class Api {
    readonly baseUrl: string;
    protected options: RequestInit;

    constructor(baseUrl: string, options: RequestInit = {}) {
        this.baseUrl = baseUrl;
        this.options = {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers ? options.headers : {}) // Объединяем заголовки, если они есть
            },
            ...options
        };
    }

    protected handleResponse<T>(response: Response): Promise<T> {
        if (response.ok) {
            return response.json() as Promise<T>;
        } else {
            return response.json().then(error => Promise.reject(error as T));
        }
    }

    get<T>(uri: string): Promise<T> {
        return fetch(this.baseUrl + uri, {
            ...this.options,
            method: 'GET'
        }).then(response => this.handleResponse<T>(response));
    }

    post<T>(uri: string, data: object = {}, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<T> {
        return fetch(this.baseUrl + uri, {
            ...this.options,
            method,
            body: JSON.stringify(data)
        }).then(response => this.handleResponse<T>(response));
    }
}