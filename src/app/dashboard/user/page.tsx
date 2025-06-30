
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Mail, Phone, User } from "lucide-react";

export default function UserDashboardPage() {
  const user = {
    name: 'Sofia Davis',
    email: 'sofia.davis@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://placehold.co/100x100.png',
    initials: 'SD'
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tighter font-headline">My Profile</h1>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-6 space-y-0">
              <Avatar className="h-24 w-24 border">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="woman portrait" />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle className="text-3xl">{user.name}</CardTitle>
                <CardDescription>View and manage your personal information.</CardDescription>
              </div>
          </CardHeader>
          <CardContent className="space-y-6 border-t pt-6 mt-6">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="w-32 text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="w-32 text-muted-foreground">Email</span>
                <span className="text-foreground font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="w-32 text-muted-foreground">Phone Number</span>
                <span className="text-foreground font-medium">{user.phone}</span>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
