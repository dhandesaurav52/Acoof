
import type { Product, Look, LookCategory } from '@/types';

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

export const looks: Look[] = [
    {
        id: 1,
        name: 'Casual Weekend',
        image: 'https://images.pexels.com/photos/2413023/pexels-photo-2413023.jpeg',
        products: ['1', '2', '6'],
        category: 'Weekend',
    },
    {
        id: 2,
        name: 'Street Style',
        image: 'https://images.pexels.com/photos/3133688/pexels-photo-3133688.jpeg',
        products: ['4', '5', '6'],
        category: 'Streetwear',
    },
    {
        id: 3,
        name: 'Smart Casual',
        image: 'https://images.pexels.com/photos/837140/pexels-photo-837140.jpeg',
        products: ['7', '2', '3'],
        category: 'Smart Casual',
    },
    {
        id: 4,
        name: 'Summer Vibe',
        image: 'https://images.pexels.com/photos/4066288/pexels-photo-4066288.jpeg',
        products: ['1', '8'],
        category: 'Summer',
    },
    {
        id: 5,
        name: 'Urban Explorer',
        image: 'https://images.pexels.com/photos/32779453/pexels-photo-32779453.jpeg',
        products: ['4', '5', '6'],
        category: 'Streetwear'
    },
    {
        id: 6,
        name: 'Office Ready',
        image: 'https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg',
        products: ['7', '5', '3'],
        category: 'Smart Casual'
    },
    {
        id: 7,
        name: 'Relaxed Day Off',
        image: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg',
        products: ['1', '2', '6'],
        category: 'Weekend'
    },
    {
        id: 8,
        name: 'Beach Day',
        image: 'https://images.pexels.com/photos/12169183/pexels-photo-12169183.jpeg',
        products: ['7', '8'],
        category: 'Summer'
    },
    {
        id: 9,
        name: 'Downtown Cool',
        image: 'https://images.pexels.com/photos/5157207/pexels-photo-5157207.jpeg',
        products: ['4', '2', '6'],
        category: 'Streetwear'
    },
    {
        id: 10,
        name: 'Skater Vibe',
        image: 'https://images.pexels.com/photos/32310255/pexels-photo-32310255.jpeg',
        products: ['1', '5', '6'],
        category: 'Streetwear'
    },
    {
        id: 11,
        name: 'Modern Professional',
        image: 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg',
        products: ['7', '5', '3'],
        category: 'Smart Casual'
    },
    {
        id: 12,
        name: 'Evening Out',
        image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
        products: ['7', '2', '3'],
        category: 'Smart Casual'
    },
    {
        id: 13,
        name: 'Coffee Run',
        image: 'https://images.pexels.com/photos/15647646/pexels-photo-15647646.jpeg',
        products: ['4', '2', '6'],
        category: 'Weekend'
    },
    {
        id: 14,
        name: 'Park Stroll',
        image: 'https://images.pexels.com/photos/32770739/pexels-photo-32770739.jpeg',
        products: ['1', '5', '6'],
        category: 'Weekend'
    },
    {
        id: 15,
        name: 'Vacation Mode',
        image: 'https://images.pexels.com/photos/1484806/pexels-photo-1484806.jpeg',
        products: ['7', '8'],
        category: 'Summer'
    },
    {
        id: 16,
        name: 'City Heat',
        image: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg',
        products: ['1', '8'],
        category: 'Summer'
    }
];
export const lookCategories: LookCategory[] = ['Streetwear', 'Smart Casual', 'Weekend', 'Summer'];


export const categories: Product['category'][] = ['Shirts', 'Tshirts', 'Pants', 'Jeans', 'Trousers', 'Shoes', 'Bags', 'Belts', 'Socks', 'Wallets', 'Sweater', 'Sweatshirt', 'Jackets', 'Track pants'];

export const alphaSizes: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
export const numericSizes: string[] = ['28', '30', '32', '34', '36'];
