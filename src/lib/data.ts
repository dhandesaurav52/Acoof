
import type { Product } from '@/types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    description: 'A timeless staple for any wardrobe, made from 100% premium cotton.',
    price: 25.0,
    category: 'Tshirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    colors: ['White', 'Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: '2',
    name: 'Slim-Fit Denim Jeans',
    description: 'Modern slim-fit jeans in a versatile dark wash.',
    price: 75.0,
    category: 'Jeans',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    colors: ['Dark Wash', 'Light Wash', 'Black'],
    sizes: ['30', '32', '34', '36']
  },
  {
    id: '3',
    name: 'Leather Derby Shoes',
    description: 'Classic derby shoes crafted from genuine leather, perfect for any occasion.',
    price: 120.0,
    category: 'Shoes',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    colors: ['Black', 'Brown'],
    sizes: ['9', '10', '11', '12']
  },
  {
    id: '4',
    name: 'Urban Graphic Hoodie',
    description: 'Comfortable cotton hoodie with a bold back print.',
    price: 65.0,
    category: 'Shirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    colors: ['Black', 'Heather Gray', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: '5',
    name: 'Cargo Trousers',
    description: 'Utilitarian cargo pants with multiple pockets for functionality.',
    price: 80.0,
    category: 'Trousers',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    colors: ['Khaki', 'Olive', 'Black'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: '6',
    name: 'Minimalist Sneakers',
    description: 'Clean and simple sneakers that pair with everything.',
    price: 90.0,
    category: 'Shoes',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    colors: ['White', 'Black', 'Cream'],
    sizes: ['8', '9', '10', '11', '12', '13']
  },
  {
    id: '7',
    name: 'Linen Button-Up Shirt',
    description: 'A breezy linen shirt, ideal for warmer weather.',
    price: 55.0,
    category: 'Shirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    colors: ['Beige', 'White', 'Light Blue'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: '8',
    name: 'Canvas Tote Bag',
    description: 'A durable and stylish canvas tote for your daily essentials.',
    price: 40.0,
    category: 'Bags',
    images: ['https://placehold.co/600x600.png'],
    isNew: true,
    colors: ['Natural', 'Black'],
    sizes: ['One Size']
  }
];

export const categories: Product['category'][] = ['Shirts', 'Tshirts', 'Oversized T-shirt', 'Pants', 'Jeans', 'Trousers', 'Shoes', 'Bags', 'Belts', 'Socks', 'Wallets', 'Sweater', 'Sweatshirt', 'Jackets', 'Track pants'];

export const alphaSizes: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
export const numericSizes: string[] = ['28', '30', '32', '34', '36'];
