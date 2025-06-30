export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'Shirts' | 'Pants' | 'Shoes' | 'Tshirts' | 'Jeans' | 'Trousers' | 'Socks' | 'Wallets' | 'Bags' | 'Belts';
  image: string;
  isNew: boolean;
  aiHint: string;
}

export interface Look {
  id: number;
  name: string;
  image: string;
  products: number[];
  aiHint: string;
}
