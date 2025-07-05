
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Don't do anything until auth state is resolved.
    if (authLoading) {
      return;
    }

    // If loading is done and there's no user, redirect to login.
    if (!user) {
      router.replace('/login');
      return; // Stop execution
    }

    // If there is a user, check if they are the admin.
    if (user.email === ADMIN_EMAIL) {
      setIsAuthorized(true);
    } else {
      // If not an admin, redirect them away.
      router.replace('/dashboard/user');
    }
  }, [user, authLoading, router]);

  // While we are waiting for authorization, show a loader.
  // The children (admin pages) will not be rendered until `isAuthorized` is true.
  // This prevents any data fetching from starting prematurely.
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only when authorized, render the admin page.
  return <>{children}</>;
}
