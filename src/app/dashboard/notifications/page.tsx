
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Package, Tag, Bell, AlertCircle, ShoppingCart, UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, get, query } from 'firebase/database';
import type { Notification as NotificationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_EMAIL = "admin@example.com";

// Static notifications for regular users
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

const getNotificationIcon = (type: NotificationType['type']) => {
    switch(type) {
        case 'order_cancellation': return UserX;
        case 'order_return': return ShoppingCart;
        case 'new_order': return Package;
        default: return Bell;
    }
}

const getNotificationColor = (type: NotificationType['type']) => {
    switch(type) {
        case 'order_cancellation': return 'text-destructive';
        case 'order_return': return 'text-yellow-500';
        case 'new_order': return 'text-green-500';
        default: return 'text-blue-500';
    }
}

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        if (loading || !user) return;

        async function fetchNotifications() {
            if (!database) {
                setError("Firebase is not configured.");
                setDataLoading(false);
                return;
            }
            
            if (isAdmin) {
                const notificationsRef = ref(database, 'notifications');
                try {
                    const snapshot = await get(query(notificationsRef));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const list: NotificationType[] = Object.keys(data)
                            .map(key => ({ id: key, ...data[key] }))
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // newest first
                        setNotifications(list);
                    } else {
                        setNotifications([]);
                    }
                } catch (err: any) {
                    console.error("Failed to fetch notifications:", err);
                    if (err.code === 'PERMISSION_DENIED') {
                        setError("Permission Denied. Please check Firebase rules for the 'notifications' path.");
                    } else {
                        setError("An error occurred while fetching notifications.");
                    }
                }
            }
            setDataLoading(false);
        }
        
        fetchNotifications();

    }, [user, loading, isAdmin]);

    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const pageTitle = isAdmin ? "Admin Notifications" : "My Notifications";
    const pageDescription = isAdmin ? "A log of important store events." : "Updates about your orders and store news.";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">{pageTitle}</h1>
                <p className="text-muted-foreground mt-2">
                    {pageDescription}
                </p>
            </div>

            {error && (
                 <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            Failed to load notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>A complete log of your notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isAdmin ? (
                        <>
                            {notifications.length === 0 && !error && (
                                <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                            )}
                            {notifications.map((notification) => {
                                const Icon = getNotificationIcon(notification.type);
                                const color = getNotificationColor(notification.type);
                                return (
                                    <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                        <Icon className={cn("h-6 w-6 mt-1 flex-shrink-0", color)} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{notification.message}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {isMounted ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : '...'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    ) : (
                        <>
                            {userNotifications.length === 0 && (
                                <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                            )}
                            {userNotifications.map((notification) => (
                                <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                    <notification.icon className={cn("h-6 w-6 mt-1 flex-shrink-0", notification.color)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{notification.text}</p>
                                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
