
'use client';

import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';

// The authorization check is now completely handled by the AdminLayout.
// This page can now simply render the component responsible for the dashboard,
// trusting that it will only be mounted for a verified admin.
export default function AdminDashboardPage() {
    return <AdminDashboardContent />;
}
