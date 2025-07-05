
'use client';

import { useProducts } from '@/hooks/use-products';
import { Loader2 } from 'lucide-react';
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';

// The auth check is now handled by the AdminLayout.
// We only need to wait for product data to finish loading.
export default function AdminDashboardPage() {
    const { loading: productsLoading } = useProducts();

    if (productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return <AdminDashboardContent />;
}
