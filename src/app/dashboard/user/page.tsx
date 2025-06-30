
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";

export default function UserDashboardPage() {
  const user = {
    name: 'Sofia Davis',
    email: 'sofia.davis@example.com',
    avatar: 'https://placehold.co/100x100.png',
    initials: 'SD'
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter font-headline">My Profile</h1>
        
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
      </div>
    </div>
  );
}
