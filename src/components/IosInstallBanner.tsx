
'use client';

import { useState, useEffect } from 'react';
import { ArrowUpSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './Logo';

export function IosInstallBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

        // Check if the user is on an iOS device and not already in standalone mode
        if (isIos() && !isInStandaloneMode()) {
            setShowBanner(true);
        }
    }, []);

    if (!showBanner) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border p-4 shadow-lg animate-in slide-in-from-bottom-full">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <Logo className="h-12 w-auto flex-shrink-0 hidden sm:block" />
                <div className="flex-grow text-sm">
                    <p className="font-semibold">Install the White Wolf App!</p>
                    <p className="text-muted-foreground">
                        Tap the <ArrowUpSquare className="inline-block h-4 w-4 align-text-bottom" /> icon and then 'Add to Home Screen'.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBanner(false)}
                    className="flex-shrink-0 rounded-full"
                    aria-label="Dismiss"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
