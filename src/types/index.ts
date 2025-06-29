export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'Shirts' | 'Pants' | 'Shoes' | 'Accessories';
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
