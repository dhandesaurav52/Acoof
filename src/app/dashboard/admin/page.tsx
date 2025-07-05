
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Loader2, AlertCircle, Package, TrendingUp, LayoutGrid } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { database } from '@/lib/firebase';
import type { OrderItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';

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
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([]);
    const [categorySalesData, setCategorySalesData] = useState<{ name: string; sales: number }[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // The AdminLayout now handles auth checks and redirection.
    // This page will only render if the user is a confirmed admin.
    useEffect(() => {
        // This effect now explicitly waits for both auth and products to be loaded.
        if (authLoading || productsLoading || !user) {
            if (!authLoading && !productsLoading) {
                setLoadingData(false);
            }
            return;
        }

        // Failsafe: Double-check admin status to prevent race conditions.
        if (user.email !== ADMIN_EMAIL) {
            setLoadingData(false);
            return;
        }
        
        async function fetchAdminData() {
            setLoadingData(true);
            try {
                if (!database) {
                    throw new Error("Firebase is not configured correctly.");
                }

                const usersRef = ref(database, 'users');
                const ordersRef = ref(database, 'orders');

                const [usersSnapshot, ordersSnapshot] = await Promise.all([
                    get(usersRef),
                    get(ordersRef)
                ]);
                
                let usersCount = 0;
                if (usersSnapshot.exists()) {
                    const usersData = usersSnapshot.val();
                    if (typeof usersData === 'object' && usersData !== null) {
                        const totalUsers = Object.keys(usersData).length;
                        const hasAdmin = Object.values(usersData).some((u: any) => u && typeof u === 'object' && u.email === ADMIN_EMAIL);
                        usersCount = hasAdmin ? totalUsers - 1 : totalUsers;
                    }
                }
                
                let totalRevenue = 0;
                let salesCount = 0;
                if (ordersSnapshot.exists()) {
                    const ordersData = ordersSnapshot.val();
                    if (typeof ordersData === 'object' && ordersData !== null) {
                        const deliveredOrders = Object.values(ordersData).filter((order: any) => order?.status === 'Delivered');
                        salesCount = deliveredOrders.length;
                        totalRevenue = deliveredOrders.reduce((acc: number, order: any) => acc + (order?.total || 0), 0);

                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const monthlySalesData = Array.from({ length: 12 }, (_, i) => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - i);
                            return { key: `${d.getFullYear()}-${d.getMonth()}`, name: monthNames[d.getMonth()], sales: 0 };
                        });

                        deliveredOrders.forEach((order: any) => {
                            if (!order.date) return;
                            const orderDate = new Date(order.date);
                            if (isNaN(orderDate.getTime())) return;
                            const orderKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
                            const monthData = monthlySalesData.find(d => d.key === orderKey);
                            if (monthData) monthData.sales++;
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
                    }
                }

                setStats({ totalRevenue, salesCount, usersCount });
                setError(null);
            } catch (e: any) {
                console.error("Failed to fetch admin data:", e);
                if (e.code === 'PERMISSION_DENIED' || e.message?.includes('permission_denied')) {
                    setError("Permission Denied. Could not fetch dashboard data. This is almost always a Firebase security rule issue. Please verify two things: 1) You are logged in as the admin user (admin@example.com). 2) Your Realtime Database security rules allow the admin user to read both the '/users' and '/orders' paths. Please check your Firebase console.");
                } else {
                    setError("An error occurred while processing the dashboard data.");
                }
            } finally {
                setLoadingData(false);
            }
        }

        fetchAdminData();
    }, [user, authLoading, productsLoading, allProducts]);
    
    // The AdminLayout handles the primary auth check, but we still show a loader
    // while waiting for all necessary data (auth, products, and stats).
    if (productsLoading || loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Here's an overview of your store.
                    </p>
                </div>

                {error ? (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-6 w-6" />
                                Dashboard Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                ) : (
                <>
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
                                {salesData.some(d => d.sales > 0) ? (
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
                                {categorySalesData.length > 0 ? (
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
                </>
                )}
            </div>
        </div>
    );
}
