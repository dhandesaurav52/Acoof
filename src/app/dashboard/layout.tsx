
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    LayoutGrid,
    Package,
    ShoppingBag,
    Heart,
    Settings,
    Bell,
    LogOut,
    Menu,
    Shield,
    User as UserIcon
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const ADMIN_EMAIL = "admin@example.com";

function DashboardNavItems() {
    const pathname = usePathname();
    const { user } = useAuth();
    const isAdmin = user?.email === ADMIN_EMAIL;
    
    const userNav = [
        { href: '/dashboard/user', label: 'Profile', icon: UserIcon },
        { href: '/dashboard/user/orders', label: 'My Orders', icon: Package },
        { href: '/dashboard/user/wishlist', label: 'Wishlist', icon: Heart },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    const adminNav = [
        { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutGrid },
        { href: '/dashboard/admin/orders', label: 'Manage Orders', icon: Package },
        { href: '/dashboard/admin/operate-store', label: 'Manage Store', icon: ShoppingBag },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    const navItems = isAdmin ? adminNav : userNav;

    return (
        <nav className="grid items-start gap-2 text-sm font-medium">
            {isAdmin && <div className="p-2 mb-2 rounded-md bg-secondary text-secondary-foreground flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" /> Admin Mode
            </div>}
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${pathname.startsWith(item.href) && (item.href !== '/dashboard/admin' || pathname === item.href) ? 'bg-muted text-primary' : 'text-muted-foreground'
                        }`}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const initials = (user?.displayName?.split(' ').map(n => n[0]).join('') || user?.email?.charAt(0).toUpperCase()) ?? 'U';
    
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <aside className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Logo className="h-10" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2 px-2 lg:px-4">
                       <DashboardNavItems />
                    </div>
                    {user && <div className="mt-auto p-4 border-t">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.photoURL ?? ''} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user.displayName ?? 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={logout}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>}
                </div>
            </aside>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                           <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href="/" className="flex items-center gap-2 font-semibold">
                                    <Logo className="h-10" />
                                </Link>
                            </div>
                             <div className="flex-1 overflow-auto py-2 px-4">
                                <DashboardNavItems />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1" />
                    {user && <Avatar>
                        <AvatarImage src={user.photoURL ?? ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>}
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">{children}</main>
            </div>
        </div>
    );
}
