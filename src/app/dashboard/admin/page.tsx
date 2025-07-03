
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, ShoppingBag, Loader2, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchAdminData() {
            if (!user) return;
            setLoading(true);
            setError(null);
            
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/admin/data', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Request failed with status ${response.status}`);
                }
    
                const data = await response.json();
                setStats({
                    totalRevenue: data.totalRevenue || 0,
                    salesCount: data.salesCount || 0,
                    usersCount: data.usersCount || 0,
                });
            } catch (e: any) {
                console.error("Failed to fetch admin data:", e);
                let detailedError = e.message;
                if (e.message.includes('Invalid auth token')) {
                    detailedError = "Authentication with the server failed. This can happen if your session has expired. Please try logging out and logging back in.";
                } else if (e.message.includes('Firebase Admin SDK not initialized')) {
                    detailedError = 'Server configuration error: The Admin SDK is not set up correctly. Please check your server environment variables and logs.';
                }
                setError(detailedError);
            } finally {
                setLoading(false);
            }
        }

        if (user && user.email === ADMIN_EMAIL) {
            fetchAdminData();
        }
    }, [user]);

    const isLoading = authLoading || loading || productsLoading;

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
                               This is often caused by a server-side configuration issue or an expired session. Please check your server logs or try logging out and back in.
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
