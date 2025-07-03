
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function OperateStorePage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldAlert className="h-6 w-6 text-destructive" />
                           Admin Page Disabled
                        </CardTitle>
                        <CardDescription>
                            This page has been temporarily disabled.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            To resolve persistent server configuration and permission errors, the admin-specific functionality has been disabled. The core customer-facing application is fully functional.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
