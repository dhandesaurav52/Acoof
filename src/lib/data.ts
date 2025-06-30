
import type { Product, Look, LookCategory } from '@/types';

export const products: Product[] = [
  {
    id: 1,
    name: 'Classic White Tee',
    description: 'A timeless staple for any wardrobe, made from 100% premium cotton.',
    price: 25.0,
    category: 'Tshirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    aiHint: 'white shirt',
    colors: ['White', 'Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 2,
    name: 'Slim-Fit Denim Jeans',
    description: 'Modern slim-fit jeans in a versatile dark wash.',
    price: 75.0,
    category: 'Jeans',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    aiHint: 'denim jeans',
    colors: ['Dark Wash', 'Light Wash', 'Black'],
    sizes: ['30', '32', '34', '36']
  },
  {
    id: 3,
    name: 'Leather Derby Shoes',
    description: 'Classic derby shoes crafted from genuine leather, perfect for any occasion.',
    price: 120.0,
    category: 'Shoes',
    images: ['https://placehold.co/600x800.png'],
    isNew: true,
    aiHint: 'leather shoes',
    colors: ['Black', 'Brown'],
    sizes: ['9', '10', '11', '12']
  },
  {
    id: 4,
    name: 'Urban Graphic Hoodie',
    description: 'Comfortable cotton hoodie with a bold back print.',
    price: 65.0,
    category: 'Shirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    aiHint: 'graphic hoodie',
    colors: ['Black', 'Heather Gray', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 5,
    name: 'Cargo Trousers',
    description: 'Utilitarian cargo pants with multiple pockets for functionality.',
    price: 80.0,
    category: 'Trousers',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    aiHint: 'cargo pants',
    colors: ['Khaki', 'Olive', 'Black'],
    sizes: ['S', 'M', 'L']
  },
  {
    id: 6,
    name: 'Minimalist Sneakers',
    description: 'Clean and simple sneakers that pair with everything.',
    price: 90.0,
    category: 'Shoes',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    aiHint: 'white sneakers',
    colors: ['White', 'Black', 'Cream'],
    sizes: ['8', '9', '10', '11', '12', '13']
  },
  {
    id: 7,
    name: 'Linen Button-Up Shirt',
    description: 'A breezy linen shirt, ideal for warmer weather.',
    price: 55.0,
    category: 'Shirts',
    images: ['https://placehold.co/600x800.png'],
    isNew: false,
    aiHint: 'linen shirt',
    colors: ['Beige', 'White', 'Light Blue'],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 8,
    name: 'Canvas Tote Bag',
    description: 'A durable and stylish canvas tote for your daily essentials.',
    price: 40.0,
    category: 'Bags',
    images: ['https://placehold.co/600x600.png'],
    isNew: true,
    aiHint: 'tote bag',
    colors: ['Natural', 'Black'],
    sizes: ['One Size']
  }
];

export const looks: Look[] = [
    {
        id: 1,
        name: 'Casual Weekend',
        image: 'https://images.pexels.com/photos/3775588/pexels-photo-3775588.jpeg',
        products: [1, 2, 6],
        aiHint: 'man standing',
        category: 'Weekend',
    },
    {
        id: 2,
        name: 'Street Style',
        image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
        products: [4, 5, 6],
        aiHint: 'street fashion',
        category: 'Streetwear',
    },
    {
        id: 3,
        name: 'Smart Casual',
        image: 'https://images.pexels.com/photos/837140/pexels-photo-837140.jpeg',
        products: [7, 2, 3],
        aiHint: 'fashion model',
        category: 'Smart Casual',
    },
    {
        id: 4,
        name: 'Summer Vibe',
        image: 'https://images.pexels.com/photos/157675/fashion-men-s-fashion-model-157675.jpeg',
        products: [1, 8],
        aiHint: 'summer style',
        category: 'Summer',
    },
    {
        id: 5,
        name: 'Urban Explorer',
        image: 'https://placehold.co/800x1000.png',
        products: [4, 5, 6],
        aiHint: 'urban fashion',
        category: 'Streetwear'
    },
    {
        id: 6,
        name: 'Office Ready',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 5, 3],
        aiHint: 'business casual',
        category: 'Smart Casual'
    },
    {
        id: 7,
        name: 'Relaxed Day Off',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 2, 6],
        aiHint: 'casual outfit',
        category: 'Weekend'
    },
    {
        id: 8,
        name: 'Beach Day',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 8],
        aiHint: 'beach fashion',
        category: 'Summer'
    },
    {
        id: 9,
        name: 'Downtown Cool',
        image: 'https://placehold.co/800x1000.png',
        products: [4, 2, 6],
        aiHint: 'downtown style',
        category: 'Streetwear'
    },
    {
        id: 10,
        name: 'Skater Vibe',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 5, 6],
        aiHint: 'skater fashion',
        category: 'Streetwear'
    },
    {
        id: 11,
        name: 'Modern Professional',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 5, 3],
        aiHint: 'professional attire',
        category: 'Smart Casual'
    },
    {
        id: 12,
        name: 'Evening Out',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 2, 3],
        aiHint: 'night out fashion',
        category: 'Smart Casual'
    },
    {
        id: 13,
        name: 'Coffee Run',
        image: 'https://placehold.co/800x1000.png',
        products: [4, 2, 6],
        aiHint: 'man drinking coffee',
        category: 'Weekend'
    },
    {
        id: 14,
        name: 'Park Stroll',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 5, 6],
        aiHint: 'man walking park',
        category: 'Weekend'
    },
    {
        id: 15,
        name: 'Vacation Mode',
        image: 'https://placehold.co/800x1000.png',
        products: [7, 8],
        aiHint: 'vacation outfit',
        category: 'Summer'
    },
    {
        id: 16,
        name: 'City Heat',
        image: 'https://placehold.co/800x1000.png',
        products: [1, 8],
        aiHint: 'summer city fashion',
        category: 'Summer'
    }
];
export const lookCategories: LookCategory[] = ['Streetwear', 'Smart Casual', 'Weekend', 'Summer'];


export const categories: Product['category'][] = ['Shirts', 'Tshirts', 'Pants', 'Jeans', 'Trousers', 'Shoes', 'Bags', 'Belts', 'Socks', 'Wallets'];
