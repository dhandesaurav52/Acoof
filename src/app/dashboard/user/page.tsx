
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Home, Mail, Phone, User, MapPin, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UserDashboardPage() {
  const { user, loading, uploadProfilePicture, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '123 Dream Lane',
    city: 'Styleville',
    state: 'CA',
    avatar: '',
    initials: ''
  });

  const [editedUser, setEditedUser] = useState(userProfile);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
        const initials = (user.displayName?.split(' ').map(n => n[0]).join('') || user.email?.charAt(0).toUpperCase()) ?? 'U';
        const profileData = {
            name: user.displayName || 'Anonymous User',
            email: user.email || 'No email provided',
            phone: user.phoneNumber || '+1 (555) 123-4567',
            address: '123 Dream Lane',
            city: 'Styleville',
            state: 'CA',
            avatar: user.photoURL || `https://placehold.co/100x100.png`,
            initials: initials
        };
        setUserProfile(profileData);
        setEditedUser(profileData);
    }
  }, [user, loading, router]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditedUser(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: editedUser.name,
        email: editedUser.email,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrentLocation = () => {
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      try {
        await uploadProfilePicture(file);
        toast({
          title: "Profile Picture Updated",
          description: "Your new profile picture has been saved.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "There was an error uploading your profile picture.",
        });
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                  <Avatar className="h-24 w-24 border">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback>{userProfile.initials}</AvatarFallback>
                  </Avatar>
                  <button
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isUploading}
                  aria-label="Change profile picture"
                  >
                  {isUploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                      <Camera className="h-8 w-8 text-white" />
                  )}
                  </button>
                  <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  disabled={isUploading}
                  />
              </div>
              <div className="flex-grow">
                  <CardTitle className="text-3xl">{userProfile.name}</CardTitle>
                  <CardDescription>View and manage your personal information.</CardDescription>
              </div>
              <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(open) setEditedUser(userProfile); setIsEditDialogOpen(open); }}>
                  <DialogTrigger asChild>
                      <Button variant="outline" className="flex-shrink-0">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                      <DialogDescription>
                          Make changes to your profile here. Click save when you're done.
                      </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" value={editedUser.name} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={editedUser.email} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={editedUser.phone} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" value={editedUser.address} onChange={handleInputChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" value={editedUser.city} onChange={handleInputChange} />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input id="state" value={editedUser.state} onChange={handleInputChange} />
                          </div>
                      </div>
                      <div className="flex justify-end">
                          <Button variant="link" size="sm" onClick={handleCurrentLocation} type="button" className="p-0 h-auto text-sm text-primary">
                              <MapPin className="mr-2 h-4 w-4" />
                              Use current location
                          </Button>
                      </div>
                      </div>
                      <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                      <Button type="submit" onClick={handleSaveChanges} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save changes
                      </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </CardHeader>
          <CardContent className="space-y-6 border-t pt-6 mt-6">
              <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="w-32 text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">{userProfile.name}</span>
              </div>
              <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="w-32 text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium">{userProfile.email}</span>
              </div>
              <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="w-32 text-muted-foreground">Phone Number</span>
                  <span className="text-foreground font-medium">{userProfile.phone}</span>
              </div>
              <div className="flex items-center gap-4">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <span className="w-32 text-muted-foreground">Address</span>
                  <span className="text-foreground font-medium">{`${userProfile.address}, ${userProfile.city}, ${userProfile.state}`}</span>
              </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
