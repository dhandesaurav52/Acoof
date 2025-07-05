
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Mail, Phone, User, MapPin, Loader2, Camera, Building, Map, Mailbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserDashboardPage() {
  const { user, loading, uploadProfilePicture, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
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
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            pincode: user.pincode || '',
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
        displayName: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        address: editedUser.address,
        city: editedUser.city,
        state: editedUser.state,
        pincode: editedUser.pincode,
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrentLocation = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'The Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.',
        });
        return;
    }
      
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support this feature.',
      });
      return;
    }

    setIsFetchingLocation(true);
    toast({
      title: 'Fetching Location',
      description: 'Please grant permission to access your location.',
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await response.json();

          if (data.status === 'OK' && data.results[0]) {
            const address = data.results[0].formatted_address;
            const addressComponents = data.results[0].address_components;
            const getAddressComponent = (type: string) => addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';

            setEditedUser(prev => ({
              ...prev,
              address: address,
              city: getAddressComponent('locality'),
              state: getAddressComponent('administrative_area_level_1'),
              pincode: getAddressComponent('postal_code'),
            }));

            toast({
              title: 'Location Updated',
              description: 'Your address has been populated.',
            });
          } else {
              let errorMessage = `Geocoding failed: ${data.status}`;
              if (data.error_message) {
                  errorMessage = `Geocoding API error: "${data.error_message}". Please check your API key and Google Cloud project settings (e.g., billing, enabled APIs).`;
              }
              toast({
                variant: 'destructive',
                title: 'Could Not Fetch Address',
                description: errorMessage,
              });
          }
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Network Error',
            description: 'Could not connect to the Geocoding service. Please check your internet connection.',
          });
        } finally {
            setIsFetchingLocation(false);
        }
      },
      (error) => {
        let message = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'You denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out.';
            break;
        }
        toast({
          variant: 'destructive',
          title: 'Geolocation Error',
          description: message,
        });
        setIsFetchingLocation(false);
      }
    );
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
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message || "There was an error uploading your profile picture.",
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border">
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
                  <CardTitle className="text-2xl sm:text-3xl">{userProfile.name}</CardTitle>
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
                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input id="pincode" value={editedUser.pincode} onChange={handleInputChange} />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="link" size="sm" onClick={handleCurrentLocation} type="button" className="p-0 h-auto text-sm text-primary" disabled={isFetchingLocation}>
                                {isFetchingLocation ? (
                                    <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Fetching...
                                    </>
                                ) : (
                                    <>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Use current location
                                    </>
                                )}
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
          <CardContent className="border-t pt-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <div className="flex gap-4">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{userProfile.name}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{userProfile.email}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">Phone Number</p>
                        <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">Address</p>
                        <p className="font-medium">{userProfile.address || 'Not provided'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Building className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">City</p>
                        <p className="font-medium">{userProfile.city || 'Not provided'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Map className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">State</p>
                        <p className="font-medium">{userProfile.state || 'Not provided'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Mailbox className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-muted-foreground">Pincode</p>
                        <p className="font-medium">{userProfile.pincode || 'Not provided'}</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
