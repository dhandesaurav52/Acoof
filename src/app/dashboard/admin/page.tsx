
'use client';

// The AdminLayout now handles all authorization and loading states before rendering this page.
// We can directly render the main content component.
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';

export default function AdminDashboardPage() {
    return <AdminDashboardContent />;
}
