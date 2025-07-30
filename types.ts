export type TAuth = {
  email: string;
  password: string;
};

export interface ProductVariant {
  id: number;
  barcode: string;
  weight: number;
  price: number;
  stock: number;
  product: {
    id: number;
    name: string;
    description?: string;
    category?: string;
  };
}

export interface CartItem {
  variantId: number;
  quantity: number;
  unitPrice: number;
  variant: ProductVariant;
}

export interface InvoiceItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant: ProductVariant;
}

export interface Invoice {
  id: number;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  items: InvoiceItem[];
  user: {
    id: number;
    email: string;
    username?: string;
  };
  tenant: {
    id: string;
    name: string;
  };
}
