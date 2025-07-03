
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
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

                if (!token || typeof token !== 'string') {
                    throw new Error("Failed to retrieve a valid authentication token from Firebase. Please try logging out and back in.");
                }

                const response = await fetch('/api/admin/data', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    let detailedError = errorData.error || `Request failed with status ${response.status}`;
                    if (errorData.detail?.includes('credential')) {
                        detailedError = 'Server configuration error. The Admin SDK is not authenticated. Please check server logs and environment variables.'
                    }
                    throw new Error(detailedError);
                }
    
                const data = await response.json();
                setStats({
                    totalRevenue: data.totalRevenue || 0,
                    salesCount: data.salesCount || 0,
                    usersCount: data.usersCount || 0,
                });
            } catch (e: any) {
                console.error("Failed to fetch admin data:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        if (user && user.email === ADMIN_EMAIL) {
            fetchAdminData();
        }
    }, [user]);

    if (authLoading || loading) {
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
                                This is often caused by a server-side configuration issue with the Firebase Admin SDK. Please check your hosting environment variables and server logs for more details.
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
                            <CardTitle className="text-sm font-medium">Manage Products</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                           <Button asChild className="w-full">
                                <Link href="/dashboard/admin/operate-store">Go to Store</Link>
                           </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
