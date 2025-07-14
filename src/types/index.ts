import { z } from 'zod';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Shirts' | 'Pants' | 'Shoes' | 'Tshirts' | 'Oversized T-shirt' | 'Jeans' | 'Trousers' | 'Socks' | 'Wallets' | 'Bags' | 'Belts' | 'Sweater' | 'Sweatshirt' | 'Jackets' | 'Track pants';
  images: string[];
  isNew: boolean;
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
  userId: string;
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
  cancellationReason?: string;
}

export interface Notification {
  id: string;
  type: 'order_cancellation' | 'order_return' | 'new_order';
  message: string;
  timestamp: string;
  read: boolean;
  orderId: string;
  userId: string;
  userEmail: string;
}

// AI Flow Types
export const OutfitImagesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  height: z.string().optional().describe("The user's height, e.g., 5'10\" or 178cm."),
  bodyType: z.string().optional().describe("The user's body type, e.g., Slim, Fit, Healthy, Fat."),
});
export type OutfitImagesInput = z.infer<typeof OutfitImagesInputSchema>;

export const OutfitImagesOutputSchema = z.object({
  images: z
    .array(
      z
        .string()
        .describe(
          "A generated image of a person in a new outfit, as a data URI."
        )
    )
    .describe('An array of three distinct outfit images as data URIs.'),
});
