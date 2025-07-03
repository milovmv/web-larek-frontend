// src/types/index.ts
export interface IProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    image: string;
  }
  
  export interface IUser {
    payment: string;
    address: string;
    email: string;
    phone: string;
    items: string[];
    total: number;
  }
  
  export class Product implements IProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    image: string;
  
    constructor(data: IProduct) {
      this.id = data.id;
      this.title = data.title;
      this.description = data.description;
      this.price = data.price;
      this.category = data.category;
      this.image = data.image;
    }
  }
  
  export class User implements IUser {
    payment: string;
    address: string;
    email: string;
    phone: string;
    items: string[];
    total: number;
  
    constructor(data: IUser) {
      this.payment = data.payment;
      this.address = data.address;
      this.email = data.email;
      this.phone = data.phone;
      this.items = data.items || [];
      this.total = data.total || 0;
    }
  
    updatePayment(method: string): void {
      this.payment = method;
    }
  
    updateAddress(address: string): void {
      this.address = address;
    }
  
    updateContactInfo(email: string, phone: string): void {
      this.email = email;
      this.phone = phone;
    }
  
    addItem(productId: string): void {
      if (!this.items.includes(productId)) {
        this.items.push(productId);
      }
    }
  
    removeItem(productId: string): void {
      this.items = this.items.filter(id => id !== productId);
    }
  
    clearItems(): void {
      this.items = [];
    }
  
    updateTotal(newTotal: number): void {
      this.total = newTotal;
    }
  
    isValidContactInfo(): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      return emailRegex.test(this.email) && phoneRegex.test(this.phone);
    }
  
    isValidAddress(): boolean {
      return this.address.trim().length > 10;
    }
  }
  
  export class CartService {
    private allProducts: IProduct[];
  
    constructor(products: IProduct[]) {
      this.allProducts = products;
    }
  
    getCartItemsDetails(userItemIds: string[]): IProduct[] {
      const cartProducts: IProduct[] = [];
      for (const itemId of userItemIds) {
        const product = this.allProducts.find(p => p.id === itemId);
        if (product) {
          cartProducts.push(product);
        }
      }
      return cartProducts;
    }
  
    getCartTotalCost(userItemIds: string[]): number {
      const cartProducts = this.getCartItemsDetails(userItemIds);
      return cartProducts.reduce((total, product) => total + product.price, 0);
    }
  }
  
  export interface IProductCardProps {
    product: IProduct;
    onAddToCart: (productId: string) => void;
    isAddedToCart: boolean;
  }
  
  export interface ICartItemDisplayProps {
    product: IProduct;
    onRemoveItem: (productId: string) => void;
  }
  
  export interface ICartSummaryProps {
    items: string[];
    allProducts: IProduct[];
    onClearCart: () => void;
    onCheckout: () => void;
  }
  
  export interface ICheckoutModalProps {
    currentUser: IUser;
    allProducts: IProduct[];
    onCompleteOrder: (updatedUser: IUser) => void;
    onClose: () => void;
  }
  
  export interface IOrderConfirmationProps {
    totalAmount: number;
    onClose: () => void;
  }
  