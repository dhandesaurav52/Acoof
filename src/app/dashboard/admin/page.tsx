'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AdminDashboardContent = dynamic(
  () => import('@/components/admin/AdminDashboardContent').then((mod) => mod.AdminDashboardContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
);

export default function AdminDashboardPage() {
    return <AdminDashboardContent />;
}
