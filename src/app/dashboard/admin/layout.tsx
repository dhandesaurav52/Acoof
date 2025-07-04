
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return; // Wait for the auth state to load
    }
    if (!user) {
      // If not logged in, redirect to login page
      router.push('/login');
    } else if (user.email !== ADMIN_EMAIL) {
      // If logged in but not an admin, redirect to user dashboard
      router.push('/dashboard/user');
    }
  }, [user, authLoading, router]);

  // While loading auth or if the user is not yet verified as admin, show a loader.
  // This prevents the child pages from rendering and attempting to fetch data.
  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is verified as admin, render the requested admin page.
  return <>{children}</>;
}
