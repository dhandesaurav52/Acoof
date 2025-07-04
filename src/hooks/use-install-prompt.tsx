
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// TypeScript interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface InstallPromptContextType {
    installPromptEvent: BeforeInstallPromptEvent | null;
    triggerInstallPrompt: () => void;
}

const InstallPromptContext = createContext<InstallPromptContextType | undefined>(undefined);

export const InstallPromptProvider = ({ children }: { children: ReactNode }) => {
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPromptEvent(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for the appinstalled event to know when the app has been installed
        const handleAppInstalled = () => {
            // Clear the deferred prompt
            setInstallPromptEvent(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const triggerInstallPrompt = useCallback(() => {
        if (!installPromptEvent) {
            return;
        }
        // Show the install prompt
        installPromptEvent.prompt();
        // Wait for the user to respond to the prompt
        installPromptEvent.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // We can only use the prompt once, so clear it.
            setInstallPromptEvent(null);
        });
    }, [installPromptEvent]);

    return (
        <InstallPromptContext.Provider value={{ installPromptEvent, triggerInstallPrompt }}>
            {children}
        </InstallPromptContext.Provider>
    );
};

export const useInstallPrompt = () => {
    const context = useContext(InstallPromptContext);
    if (context === undefined) {
        throw new Error('useInstallPrompt must be used within an InstallPromptProvider');
    }
    return context;
};
