
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tighter font-headline">Settings</h1>
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
        </div>
    </div>
  );
}
