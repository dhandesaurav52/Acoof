
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";

export default function UserDashboardPage() {
  const user = {
    name: 'Sofia Davis',
    email: 'sofia.davis@example.com',
    avatar: 'https://placehold.co/100x100.png',
    initials: 'SD'
  };

  const orders = [
    { id: 'ORD001', date: '2023-10-26', total: '$165.00', status: 'Shipped' },
    { id: 'ORD002', date: '2023-10-24', total: '$75.00', status: 'Delivered' },
    { id: 'ORD003', date: '2023-10-21', total: '$25.00', status: 'Delivered' },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter font-headline">My Dashboard</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="woman portrait" />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Check the status of your recent orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
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
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Shipped' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" size="sm">View Details</Button>
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
