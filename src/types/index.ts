export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'Shirts' | 'Pants' | 'Shoes' | 'Tshirts' | 'Jeans' | 'Trousers' | 'Socks' | 'Wallets' | 'Bags' | 'Belts';
  images: string[];
  isNew: boolean;
  aiHint: string;
  colors: string[];
  sizes: string[];
}

export type LookCategory = 'Streetwear' | 'Smart Casual' | 'Weekend' | 'Summer';

export interface Look {
  id: number;
  name: string;
  image: string;
  products: number[];
  aiHint: string;
  category: LookCategory;
}

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user: string;
  userEmail: string;
  date: string;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  items: OrderItem[];
}
