export interface IProductApiResponse {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    image: string;
  }
  
  export interface IGetProductsResponse {
    products: IProductApiResponse[];
    totalCount: number;
  }