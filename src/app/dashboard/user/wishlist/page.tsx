
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist } from '@/hooks/use-wishlist';
import { Loader2, Heart } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WishlistPage() {
    const { user, loading } = useAuth();
    const { wishlist } = useWishlist();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-left">
                    <h1 className="text-4xl font-bold tracking-tighter font-headline">My Wishlist</h1>
                    <p className="text-muted-foreground mt-2">
                        Your collection of favorite items.
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {wishlist.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h2 className="mt-6 text-xl font-semibold">Your wishlist is empty</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Looks like you haven't added anything to your wishlist yet.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/products">Start Shopping</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
