
'use client';

// This page is obsolete. The AI Stylist feature has been integrated
// directly into the Lookbook page at /lookbook.
// This file is preserved to prevent 404 errors but can be safely removed
// if all links to /virtual-try-on are updated.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VirtualTryOnRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/lookbook');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Redirecting to the Lookbook...</p>
            </div>
        </div>
    );
}
