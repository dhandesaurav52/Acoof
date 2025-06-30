
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, UserPlus, ShoppingCart, Package, Tag, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = "admin@example.com";

// Admin notifications
const adminNotifications = [
    {
        id: 1,
        icon: AlertCircle,
        color: 'text-yellow-500',
        text: "Product 'Minimalist Sneakers' is low on stock. Only 2 items left.",
        time: '15 minutes ago',
    },
    {
        id: 2,
        icon: UserPlus,
        color: 'text-green-500',
        text: 'A new user, alex.doe@example.com, just signed up.',
        time: '1 hour ago',
    },
    {
        id: 3,
        icon: ShoppingCart,
        color: 'text-blue-500',
        text: 'Order ORD011 has been successfully shipped.',
        time: '4 hours ago',
    }
];

// User notifications
const userNotifications = [
      {
        id: 1,
        icon: Package,
        color: 'text-green-500',
        text: 'Your order #ORD007 has been delivered!',
        time: '2 days ago',
      },
      {
        id: 2,
        icon: Tag,
        color: 'text-primary',
        text: 'The new Summer collection just dropped. Check it out!',
        time: '4 days ago',
      },
      {
        id: 3,
        icon: Bell,
        color: 'text-blue-500',
        text: 'Welcome to Acoof! Complete your profile to get personalized recommendations.',
        time: '1 week ago',
      },
];

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const is_admin = user.email === ADMIN_EMAIL;
    const notifications = is_admin ? adminNotifications : userNotifications;
    const pageTitle = is_admin ? "Admin Notifications" : "My Notifications";
    const pageDescription = is_admin ? "Recent activity and alerts for your store." : "Updates about your orders and store news.";

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tighter font-headline">{pageTitle}</h1>
                <p className="text-muted-foreground mt-2">
                    {pageDescription}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>A complete log of your notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                            <notification.icon className={cn("h-6 w-6 mt-1 flex-shrink-0", notification.color)} />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{notification.text}</p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                            </div>
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
