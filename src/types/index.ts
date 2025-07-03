
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Shirts' | 'Pants' | 'Shoes' | 'Tshirts' | 'Jeans' | 'Trousers' | 'Socks' | 'Wallets' | 'Bags' | 'Belts' | 'Sweater' | 'Sweatshirt' | 'Jackets' | 'Track pants';
  images: string[];
  isNew: boolean;
  aiHint: string;
  colors: string[];
  sizes: string[];
}

export type CartItem = Product & { quantity: number };

export type LookCategory = 'Streetwear' | 'Smart Casual' | 'Weekend' | 'Summer';

export interface Look {
  id: number;
  name: string;
  image: string;
  products: string[];
  aiHint: string;
  category: LookCategory;
}

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
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
  paymentMethod: 'Razorpay' | 'COD';
  orderId?: string; // Razorpay Order ID
  paymentId?: string;
  paymentSignature?: string;
}
