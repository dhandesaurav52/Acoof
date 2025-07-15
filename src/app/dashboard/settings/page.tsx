
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Moon, Sun, Monitor, AlertCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = "admin@example.com";

export default function SettingsPage() {
    const { user, loading, logout, deleteAccount } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            });
            // The logout/redirect is handled by the deleteAccount function
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message,
            });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account and website settings.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                         <Label htmlFor="email-notifications" className="flex flex-col gap-1">
                            <span>Email Notifications</span>
                            <span className="font-normal text-muted-foreground">Receive emails about your account and new products.</span>
                        </Label>
                        <Switch id="email-notifications" defaultChecked/>
                    </div>
                     <div className="flex items-center justify-between">
                         <Label htmlFor="push-notifications" className="flex flex-col gap-1">
                            <span>Push Notifications</span>
                            <span className="font-normal text-muted-foreground">Get push notifications on your devices.</span>
                        </Label>
                        <Switch id="push-notifications" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme" className="flex flex-col gap-1">
                            <span>Theme</span>
                            <span className="font-normal text-muted-foreground">Select a theme for the application.</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button variant={theme === 'light' ? 'default' : 'ghost'} size="icon" onClick={() => setTheme('light')}>
                                <Sun className="h-5 w-5" />
                            </Button>
                             <Button variant={theme === 'dark' ? 'default' : 'ghost'} size="icon" onClick={() => setTheme('dark')}>
                                <Moon className="h-5 w-5" />
                            </Button>
                             <Button variant={theme === 'system' ? 'default' : 'ghost'} size="icon" onClick={() => setTheme('system')}>
                                <Monitor className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!isAdmin && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle>Danger Zone</CardTitle>
                        <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <p className="text-sm font-medium">Delete your account and all data.</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeleteAccount} 
                                        disabled={isDeleting}
                                        className={buttonVariants({ variant: "destructive" })}
                                    >
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
