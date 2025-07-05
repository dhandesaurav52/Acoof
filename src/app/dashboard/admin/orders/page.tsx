
'use client';

import { AdminOrdersManager } from '@/components/admin/AdminOrdersManager';

// The authorization check is now completely handled by the AdminLayout.
// This page can now simply render the component responsible for managing orders,
// trusting that it will only be mounted for a verified admin.
export default function AdminOrdersPage() {
    return <AdminOrdersManager />;
}
