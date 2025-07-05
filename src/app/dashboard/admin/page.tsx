
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Loader2 } from 'lucide-react';
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { loading: productsLoading } = useProducts();

    // This is the definitive guard. It prevents the component that fetches data
    // from rendering until all permissions and dependent data are ready.
    if (authLoading || productsLoading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // Only when the user is a confirmed admin, render the component that contains the dashboard.
    return <AdminDashboardContent />;
}
