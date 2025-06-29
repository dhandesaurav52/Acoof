
import { BarChart, Package, ShoppingCart, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminDashboardPage() {
    const orders = [
        { id: 'ORD012', user: 'Liam Johnson', date: '2023-10-27', total: '$250.00', status: 'Pending' },
        { id: 'ORD011', user: 'Olivia Smith', date: '2023-10-26', total: '$150.00', status: 'Shipped' },
        { id: 'ORD010', user: 'Noah Williams', date: '2023-10-25', total: '$350.00', status: 'Shipped' },
        { id: 'ORD009', user: 'Emma Brown', date: '2023-10-24', total: '$450.00', status: 'Delivered' },
        { id: 'ORD008', user: 'Ava Jones', date: '2023-10-23', total: '$550.00', status: 'Delivered' },
    ];

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col gap-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tighter font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    An overview of your store's performance.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">2 products need restocking</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>A list of the most recent orders.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.user}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>{order.total}</TableCell>
                            <TableCell>
                            <Badge 
                                variant={
                                    order.status === 'Pending' ? 'destructive' :
                                    order.status === 'Shipped' ? 'default' :
                                    'secondary'
                                }
                            >
                                {order.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="link" size="sm">View Order</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
