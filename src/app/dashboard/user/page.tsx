
'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Home, Mail, Phone, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserDashboardPage() {
  const { toast } = useToast();

  const [user, setUser] = useState({
    name: 'Sofia Davis',
    email: 'sofia.davis@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Dream Lane',
    city: 'Styleville',
    state: 'CA',
    avatar: 'https://placehold.co/100x100.png',
    initials: 'SD'
  });

  const [editedUser, setEditedUser] = useState(user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditedUser(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = () => {
    setUser(editedUser);
  };

  const handleCurrentLocation = () => {
    // Mocking getting user's location
    setEditedUser(prev => ({
        ...prev,
        city: 'San Francisco',
        state: 'CA'
    }));
    toast({
        title: "Location Updated",
        description: "City and State have been set to your current location."
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tighter font-headline">My Profile</h1>
            <Dialog onOpenChange={(open) => { if (open) setEditedUser(user)}}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value={editedUser.name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" type="email" value={editedUser.email} onChange={handleInputChange} className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input id="phone" value={editedUser.phone} onChange={handleInputChange} className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Input id="address" value={editedUser.address} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">
                      City
                    </Label>
                    <Input id="city" value={editedUser.city} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="state" className="text-right">
                      State
                    </Label>
                    <Input id="state" value={editedUser.state} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <Button variant="link" size="sm" onClick={handleCurrentLocation} type="button" className="p-0 h-auto text-sm">
                        <MapPin className="mr-2 h-4 w-4" />
                        Use current location
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button type="submit" onClick={handleSaveChanges}>Save changes</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              <div className="flex items-center gap-4">
                <Home className="h-5 w-5 text-muted-foreground" />
                <span className="w-32 text-muted-foreground">Address</span>
                <span className="text-foreground font-medium">{`${user.address}, ${user.city}, ${user.state}`}</span>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
