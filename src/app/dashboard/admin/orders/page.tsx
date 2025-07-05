
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { AdminOrdersManager } from '@/components/admin/AdminOrdersManager';

export default function AdminOrdersPage() {
    const { user, loading: authLoading } = useAuth();

    // This is the definitive guard. It prevents the component that fetches data
    // from rendering until the user's admin status is fully confirmed.
    if (authLoading || !user || user.email !== 'admin@example.com') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Only when the user is a confirmed admin, render the component that fetches and manages orders.
    return <AdminOrdersManager />;
}
