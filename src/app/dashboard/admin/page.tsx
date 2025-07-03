
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Loader2, AlertCircle, Package, TrendingUp, LayoutGrid } from 'lucide-react';
import { ref, get, type DataSnapshot } from 'firebase/database';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { database } from '@/lib/firebase';
import type { OrderItem } from '@/types';


const ADMIN_EMAIL = "admin@example.com";

interface AdminStats {
    totalRevenue: number;
    salesCount: number;
    usersCount: number;
}

const salesChartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const categoryChartConfig = {
    sales: {
      label: "Items Sold",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;


export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { products: allProducts, loading: productsLoading } = useProducts();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([]);
    const [categorySalesData, setCategorySalesData] = useState<{ name: string; sales: number }[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchAdminData() {
            if (!user || !database || allProducts.length === 0) {
                 if (!authLoading && !productsLoading) {
                    setLoadingStats(false);
                }
                return;
            };

            setLoadingStats(true);
            setError(null);
            
            if (user.email !== ADMIN_EMAIL) {
                setError(`Access Denied: You must be logged in as ${ADMIN_EMAIL} to view this dashboard.`);
                setLoadingStats(false);
                return;
            }

            let usersSnapshot: DataSnapshot;
            let ordersSnapshot: DataSnapshot;

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

            try {
                let usersCount = 0;
                if (usersSnapshot.exists()) {
                    const usersData = usersSnapshot.val();
                    if (typeof usersData === 'object' && usersData !== null) {
                        const totalUsers = Object.keys(usersData).length;
                        const hasAdmin = Object.values(usersData).some((u: any) => u && typeof u === 'object' && u.email === ADMIN_EMAIL);
                        usersCount = hasAdmin ? totalUsers - 1 : totalUsers;
                    } else {
                        console.warn("Expected '/users' to be an object, but it was not. Data:", usersData);
                    }
                }
                
                let totalRevenue = 0;
                let salesCount = 0;
                if (ordersSnapshot.exists()) {
                    const ordersData = ordersSnapshot.val();
                    if (typeof ordersData === 'object' && ordersData !== null) {
                        const deliveredOrders = Object.values(ordersData).filter((order: any) => order?.status === 'Delivered');

                        salesCount = deliveredOrders.length;
                        
                        totalRevenue = deliveredOrders.reduce((acc: number, order: any) => {
                            if (order && typeof order.total === 'number') {
                                return acc + order.total;
                            }
                            return acc;
                        }, 0);

                        // Process data for sales chart
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        
                        const monthlySalesData = Array.from({ length: 12 }, (_, i) => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - i);
                            return {
                                key: `${d.getFullYear()}-${d.getMonth()}`,
                                name: monthNames[d.getMonth()],
                                sales: 0,
                            };
                        });

                        deliveredOrders.forEach((order: any) => {
                            if (!order.date) return;
                            try {
                                const orderDate = new Date(order.date);
                                if (isNaN(orderDate.getTime())) return;
                                
                                const orderKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
                                const monthData = monthlySalesData.find(d => d.key === orderKey);
                                
                                if (monthData) {
                                    monthData.sales++;
                                }
                            } catch (e) {
                                console.warn(`Could not parse date for order`);
                            }
                        });
                        
                        setSalesData(monthlySalesData.reverse().map(d => ({ name: d.name, sales: d.sales })));
                        
                        const salesByCategory: { [category: string]: number } = {};
    
                        deliveredOrders.forEach((order: any) => {
                            if (!order.items || !Array.isArray(order.items)) return;

                            order.items.forEach((item: OrderItem) => {
                                if (!item.productId) return;
                                const product = allProducts.find(p => p.id === item.productId);
                                if (product) {
                                    const category = product.category;
                                    salesByCategory[category] = (salesByCategory[category] || 0) + (item.quantity || 1);
                                }
                            });
                        });

                        const categoryData = Object.keys(salesByCategory).map(category => ({
                            name: category,
                            sales: salesByCategory[category]
                        })).sort((a, b) => b.sales - a.sales); 

                        setCategorySalesData(categoryData);

                    } else {
                        console.warn("Expected '/orders' to be an object, but it was not. Data:", ordersData);
                    }
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

        if (!authLoading && user && !productsLoading) {
            fetchAdminData();
        }
    }, [user, authLoading, allProducts, productsLoading]);
    
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
                               This may be caused by your Firebase Realtime Database security rules. Please ensure they are configured correctly to allow admin access.
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
                            <div className="text-2xl font-bold">{allProducts.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-6 w-6" />
                                Sales Overview
                            </CardTitle>
                            <CardDescription>Number of sales for the last 12 months.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingStats ? (
                                <div className="flex items-center justify-center h-[300px]">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : salesData.some(d => d.sales > 0) ? (
                                <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                                    <BarChart data={salesData} margin={{ left: -20, top: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                        />
                                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    No sales data available for the last 12 months.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutGrid className="h-6 w-6" />
                                Top Selling Categories
                            </CardTitle>
                            <CardDescription>Total items sold per category.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingStats ? (
                                <div className="flex items-center justify-center h-[300px]">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : categorySalesData.length > 0 ? (
                                <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                                    <BarChart data={categorySalesData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid horizontal={false} />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            width={80}
                                            interval={0}
                                        />
                                        <XAxis
                                            dataKey="sales"
                                            type="number"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            content={<ChartTooltipContent indicator="dot" />}
                                        />
                                        <Bar dataKey="sales" layout="vertical" fill="hsl(var(--primary))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    No category sales data available.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
