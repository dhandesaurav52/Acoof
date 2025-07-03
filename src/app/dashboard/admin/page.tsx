
'use client';

import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, ShoppingBag, Loader2, AlertCircle, Package, TrendingUp, Trash2, Search, ListFilter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { database } from '@/lib/firebase';
import { ref, get, type DataSnapshot } from 'firebase/database';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { Product } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { categories } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const ADMIN_EMAIL = "admin@example.com";

interface AdminStats {
    totalRevenue: number;
    salesCount: number;
    usersCount: number;
}

const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { products: allProducts, loading: productsLoading, removeProduct } = useProducts();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for product management
    const { toast } = useToast();
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedColor, setSelectedColor] = useState('All');
    const [selectedSize, setSelectedSize] = useState('All');
    const [sortOption, setSortOption] = useState('default');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchAdminData() {
            if (!user || !database) return;

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

        if (!authLoading && user) {
            fetchAdminData();
        }
    }, [user, authLoading]);
    
    // Logic for product management
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    };
    
    const availableColors = useMemo(() => {
      const allColors = allProducts.flatMap(p => p.colors || []);
      return ['All', ...Array.from(new Set(allColors))];
    }, [allProducts]);
  
    const availableSizes = useMemo(() => {
      const allSizes = allProducts.flatMap(p => p.sizes || []);
      return ['All', ...Array.from(new Set(allSizes))];
    }, [allProducts]);
  
    const filteredProducts = useMemo(() => {
      let filtered = allProducts
        .filter(product => selectedCategory === 'All' || product.category === selectedCategory)
        .filter(product => selectedColor === 'All' || product.colors?.includes(selectedColor))
        .filter(product => selectedSize === 'All' || product.sizes?.includes(selectedSize))
        .filter(product => {
          if (!searchQuery) return true;
          const lowercasedQuery = searchQuery.toLowerCase();
          return (
            product.name.toLowerCase().includes(lowercasedQuery) ||
            product.description.toLowerCase().includes(lowercasedQuery) ||
            product.category.toLowerCase().includes(lowercasedQuery)
          );
        });
        
      const sorted = [...filtered];
  
      switch (sortOption) {
        case 'price-asc':
          sorted.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          sorted.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          sorted.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
  
      return sorted;
    }, [searchQuery, allProducts, selectedCategory, selectedColor, selectedSize, sortOption]);

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);

        try {
            await removeProduct(productToDelete);
            toast({ title: "Product Removed", description: `"${productToDelete.name}" has been removed from the store.` });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Removal Failed',
                description: "Could not remove product. Please check console for details.",
            });
            console.error("Failed to remove product:", error);
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };


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
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                        <CardTitle>Manage Products</CardTitle>
                        <CardDescription>View, edit, and remove products from your store.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="mb-8 flex flex-col gap-4">
                            <div className="relative w-full">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search products by name, ID, category..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All Categories</SelectItem>
                                  {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                    
                              <Select value={selectedColor} onValueChange={setSelectedColor}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All Colors" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableColors.map(color => (
                                      <SelectItem key={color} value={color}>{color === 'All' ? 'All Colors' : color}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select value={selectedSize} onValueChange={setSelectedSize}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="All Sizes" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSizes.map(size => (
                                      <SelectItem key={size} value={size}>{size === 'All' ? 'All Sizes' : size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="outline" className="w-full sm:w-auto flex-shrink-0">
                                          <ListFilter className="mr-2 h-4 w-4" />
                                          Sort
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                                          <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="name-asc">Name: A to Z</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="name-desc">Name: Z to A</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="price-asc">Price: Low to High</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="price-desc">Price: High to Low</DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Image</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Image
                                                    src={product.images[0] || 'https://placehold.co/64x64.png'}
                                                    alt={product.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-md object-cover"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.id}</div>
                                            </TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => setProductToDelete(product)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No products found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product <span className="font-semibold">"{productToDelete?.name}"</span> and all of its associated images from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isDeleting}>Back</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete} 
                            disabled={isDeleting} 
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isDeleting ? "Deleting..." : "Confirm Deletion"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
