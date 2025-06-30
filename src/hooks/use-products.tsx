
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Product } from '@/types';
import { products as initialProducts } from '@/lib/data';

interface ProductsContextType {
    products: Product[];
    addProduct: (product: Product) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>(initialProducts);

    const addProduct = (newProduct: Product) => {
        setProducts(prevProducts => [newProduct, ...prevProducts]);
    };

    return (
        <ProductsContext.Provider value={{ products, addProduct }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductsProvider');
    }
    return context;
};
