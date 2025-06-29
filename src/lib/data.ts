import type { Product, Look } from '@/types';

export const products: Product[] = [
  {
    id: 1,
    name: 'Classic White Tee',
    description: 'A timeless staple for any wardrobe, made from 100% premium cotton.',
    price: 25.0,
    category: 'Shirts',
    image: 'https://placehold.co/600x800.png',
    isNew: true,
    aiHint: 'white shirt'
  },
  {
    id: 2,
    name: 'Slim-Fit Denim Jeans',
    description: 'Modern slim-fit jeans in a versatile dark wash.',
    price: 75.0,
    category: 'Pants',
    image: 'https://placehold.co/600x800.png',
    isNew: true,
    aiHint: 'denim jeans'
  },
  {
    id: 3,
    name: 'Leather Derby Shoes',
    description: 'Classic derby shoes crafted from genuine leather, perfect for any occasion.',
    price: 120.0,
    category: 'Shoes',
    image: 'https://placehold.co/600x800.png',
    isNew: true,
    aiHint: 'leather shoes'
  },
  {
    id: 4,
    name: 'Urban Graphic Hoodie',
    description: 'Comfortable cotton hoodie with a bold back print.',
    price: 65.0,
    category: 'Shirts',
    image: 'https://placehold.co/600x800.png',
    isNew: false,
    aiHint: 'graphic hoodie'
  },
  {
    id: 5,
    name: 'Cargo Trousers',
    description: 'Utilitarian cargo pants with multiple pockets for functionality.',
    price: 80.0,
    category: 'Pants',
    image: 'https://placehold.co/600x800.png',
    isNew: false,
    aiHint: 'cargo pants'
  },
  {
    id: 6,
    name: 'Minimalist Sneakers',
    description: 'Clean and simple sneakers that pair with everything.',
    price: 90.0,
    category: 'Shoes',
    image: 'https://placehold.co/600x800.png',
    isNew: false,
    aiHint: 'white sneakers'
  },
  {
    id: 7,
    name: 'Linen Button-Up Shirt',
    description: 'A breezy linen shirt, ideal for warmer weather.',
    price: 55.0,
    category: 'Shirts',
    image: 'https://placehold.co/600x800.png',
    isNew: false,
    aiHint: 'linen shirt'
  },
  {
    id: 8,
    name: 'Canvas Tote Bag',
    description: 'A durable and stylish canvas tote for your daily essentials.',
    price: 40.0,
    category: 'Accessories',
    image: 'https://placehold.co/600x600.png',
    isNew: true,
    aiHint: 'tote bag'
  },
  {
    id: 9,
    name: 'Aviator Sunglasses',
    description: 'Timeless aviator sunglasses with UV protection.',
    price: 45.0,
    category: 'Accessories',
    image: 'https://placehold.co/600x400.png',
    isNew: false,
    aiHint: 'sunglasses fashion'
  }
];

export const looks: Look[] = [
    {
        id: 1,
        name: 'Casual Weekend',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 2, 6],
        aiHint: 'man standing'
    },
    {
        id: 2,
        name: 'Street Style',
        image: 'https://placehold.co/800x1000.png',
        products: [4, 5, 6],
        aiHint: 'street fashion'
    },
    {
        id: 3,
        name: 'Smart Casual',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 2, 3],
        aiHint: 'fashion model'
    },
    {
        id: 4,
        name: 'Summer Vibe',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 8, 9],
        aiHint: 'summer style'
    }
];

export const categories: Product['category'][] = ['Shirts', 'Pants', 'Shoes', 'Accessories'];
