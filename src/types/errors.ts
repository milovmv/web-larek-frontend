export interface IApiError {
    code: string;
    message: string;
    status?: number;
    details?: any;
  }