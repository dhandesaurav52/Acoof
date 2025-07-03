
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, ShoppingBag, Loader2, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { database } from '@/lib/firebase';
import { ref, get, type DataSnapshot } from 'firebase/database';

const ADMIN_EMAIL = "admin@example.com";

interface AdminStats {
    totalRevenue: number;
    salesCount: number;
    usersCount: number;
}

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { products, loading: productsLoading } = useProducts();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchAdminData() {
            if (!user || !database) return;

            setLoadingStats(true);
            setError(null);
            
            let usersSnapshot: DataSnapshot;
            let ordersSnapshot: DataSnapshot;

            // Fetch users data first to isolate potential errors
            try {
                const usersRef = ref(database, 'users');
                usersSnapshot = await get(usersRef);
            } catch (e: any) {
                console.error("Failed to fetch users data:", e);
                if (e.code === 'PERMISSION_DENIED' || e.message?.includes('permission_denied')) {
                    setError("Permission Denied: Could not fetch user data. Please ensure your Firebase Realtime Database rules grant the admin read access to the '/users' path.");
                } else {
                    setError("An error occurred while fetching user data.");
                }
                setLoadingStats(false);
                return;
            }
            
            // Fetch orders data second
            try {
                const ordersRef = ref(database, 'orders');
                ordersSnapshot = await get(ordersRef);
            } catch (e: any) {
                console.error("Failed to fetch orders data:", e);
                if (e.code === 'PERMISSION_DENIED' || e.message?.includes('permission_denied')) {
                    setError("Permission Denied: Could not fetch order data. Please ensure your Firebase Realtime Database rules grant the admin read access to the '/orders' path.");
                } else {
                    setError("An error occurred while fetching order data.");
                }
                setLoadingStats(false);
                return;
            }

            // Process data now that both fetches succeeded
            try {
                let usersCount = 0;
                if (usersSnapshot.exists()) {
                    const usersData = usersSnapshot.val();
                    const totalUsers = usersSnapshot.numChildren();
                    const hasAdmin = Object.values(usersData).some((u: any) => u.email === ADMIN_EMAIL);
                    usersCount = hasAdmin ? totalUsers - 1 : totalUsers;
                }
                
                let totalRevenue = 0;
                let salesCount = 0;
                if (ordersSnapshot.exists()) {
                    const ordersData = ordersSnapshot.val();
                    salesCount = Object.keys(ordersData).length;
                    totalRevenue = Object.values(ordersData).reduce((acc: number, order: any) => acc + (order.total || 0), 0);
                }

                setStats({
                    totalRevenue,
                    salesCount,
                    usersCount,
                });

            } catch (e: any) {
                console.error("Failed to process admin data:", e);
                setError("An error occurred while processing the dashboard data.");
            } finally {
                setLoadingStats(false);
            }
        }

        if (!authLoading && user && user.email === ADMIN_EMAIL) {
            fetchAdminData();
        }
    }, [user, authLoading]);

    const isLoading = authLoading || loadingStats || productsLoading;

    if (isLoading && !error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-left">
                    <h1 className="text-4xl font-bold tracking-tighter font-headline">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome, {user?.displayName || 'Admin'}. Here's an overview of your store.
                    </p>
                </div>

                {error && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-6 w-6" />
                                Dashboard Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive">{error}</p>
                            <p className="text-muted-foreground mt-2 text-sm">
                               This is likely caused by your Firebase Realtime Database security rules. Please ensure they are configured correctly to allow admin access.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats?.totalRevenue.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sales</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{stats?.salesCount || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.usersCount || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{products.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Store Management</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                         <Button asChild className="w-full sm:w-auto">
                            <Link href="/dashboard/admin/operate-store">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Manage Products
                            </Link>
                       </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
