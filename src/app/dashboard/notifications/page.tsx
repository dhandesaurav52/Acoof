
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Package, Tag, Bell, AlertCircle, ShoppingCart, UserX, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, get, query, update, onValue } from 'firebase/database';
import type { Notification as NotificationType, Order } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { updateOrderStatusAndNotify } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = "admin@example.com";

const getNotificationIcon = (type: NotificationType['type']) => {
    switch(type) {
        case 'order_cancellation': return UserX;
        case 'order_return': return ShoppingCart;
        case 'new_order': return Package;
        case 'order_accepted': return ThumbsUp;
        case 'order_rejected': return ThumbsDown;
        default: return Bell;
    }
}

const getNotificationColor = (type: NotificationType['type']) => {
    switch(type) {
        case 'order_cancellation': return 'text-destructive';
        case 'order_return': return 'text-yellow-500';
        case 'new_order': return 'text-blue-500';
        case 'order_accepted': return 'text-green-500';
        case 'order_rejected': return 'text-destructive';
        default: return 'text-blue-500';
    }
}

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [orders, setOrders] = useState<{ [key: string]: Order }>({});
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [processingNotification, setProcessingNotification] = useState<string | null>(null);
    
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

        setDataLoading(true);
        const notificationsRef = isAdmin ? ref(database, 'notifications') : ref(database, `user-notifications/${user.uid}`);
        
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: NotificationType[] = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setNotifications(list);
            } else {
                setNotifications([]);
            }
            setDataLoading(false);
        }, (err) => {
            console.error("Failed to fetch notifications:", err);
            setError("An error occurred while fetching notifications.");
            setDataLoading(false);
        });

        return () => unsubscribe();

    }, [user, loading, isAdmin]);

    useEffect(() => {
        if (!isAdmin || notifications.length === 0) return;

        const orderIds = [...new Set(notifications.map(n => n.orderId))];
        const ordersRef = ref(database, 'orders');

        get(query(ordersRef)).then(snapshot => {
            if (snapshot.exists()) {
                const allOrders = snapshot.val();
                const relevantOrders = orderIds.reduce((acc, id) => {
                    if (allOrders[id]) {
                        acc[id] = { ...allOrders[id], id };
                    }
                    return acc;
                }, {} as { [key: string]: Order });
                setOrders(relevantOrders);
            }
        });
    }, [notifications, isAdmin]);

    const handleOrderAction = async (notification: NotificationType, newStatus: 'Shipped' | 'Cancelled') => {
        if (!user || !isAdmin) return;
        
        const order = orders[notification.orderId];
        if (!order) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find the associated order.' });
            return;
        }

        setProcessingNotification(notification.id);
        const idToken = await user.getIdToken();
        const result = await updateOrderStatusAndNotify(order, newStatus, idToken);
        
        if (result.success) {
            toast({
                title: 'Order Updated',
                description: `Order has been ${newStatus === 'Shipped' ? 'accepted' : 'rejected'}.`,
            });
            // Mark the admin notification as "read" or handled
            const notifRef = ref(database, `notifications/${notification.id}`);
            await update(notifRef, { read: true });

        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
        setProcessingNotification(null);
    };


    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const pageTitle = isAdmin ? "Admin Notifications" : "My Notifications";
    const pageDescription = isAdmin ? "A log of important store events. New orders can be managed here." : "Updates about your orders and store news.";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
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
                    {notifications.length === 0 && !error && (
                        <p className="text-muted-foreground text-center py-8">You have no new notifications.</p>
                    )}
                    {notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        const color = getNotificationColor(notification.type);
                        const isProcessing = processingNotification === notification.id;

                        const orderForNotif = orders[notification.orderId];
                        const orderIsPending = orderForNotif?.status === 'Pending';

                        return (
                            <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                <Icon className={cn("h-6 w-6 mt-1 flex-shrink-0", color)} />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isMounted ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : '...'}
                                    </p>
                                     {isAdmin && notification.type === 'new_order' && !notification.read && orderIsPending && (
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" onClick={() => handleOrderAction(notification, 'Shipped')} disabled={isProcessing}>
                                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleOrderAction(notification, 'Cancelled')} disabled={isProcessing}>
                                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
