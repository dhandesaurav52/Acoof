
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
    // Wait until the authentication state is fully loaded
    if (authLoading) {
      return;
    }
    // If loading is finished, check the user's status
    if (!user) {
      router.replace('/login');
    } else if (user.email !== ADMIN_EMAIL) {
      router.replace('/dashboard/user');
    }
  }, [user, authLoading, router]);

  // While loading auth state OR if the user is not the verified admin,
  // show a loader and prevent the child components from rendering.
  // This is the crucial step that prevents race conditions.
  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only if the user is fully authenticated as an admin, render the children.
  return <>{children}</>;
}
