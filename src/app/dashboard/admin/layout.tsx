
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // The redirect logic is a side effect and should be in useEffect.
  // This will trigger a redirect if the user is not authorized.
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.email !== ADMIN_EMAIL) {
        router.replace('/dashboard/user');
      }
    }
  }, [user, authLoading, router]);

  // The render guard is the most critical part. We will not render children
  // unless we are certain the user is an authenticated admin.
  // While authentication is loading, or if the user is not the admin,
  // we render a full-screen loader. The redirect will happen in the background.
  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only when we are past the loading state and have confirmed the user is an admin,
  // do we render the actual admin content.
  return <>{children}</>;
}
