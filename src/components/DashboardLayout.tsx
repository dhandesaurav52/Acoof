
'use client';

import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Heart,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from './ui/sidebar';

const ADMIN_EMAIL = "admin@example.com";

function MobileSheetClose({ children }: { children: React.ReactNode }) {
    const { isMobile, setOpenMobile } = useSidebar()
    if (!isMobile) {
        return <>{children}</>
    }
    return <div onClick={() => setOpenMobile(false)}>{children}</div>
}


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const initials = (user?.displayName?.split(' ').map(n => n[0]).join('') || user?.email?.charAt(0).toUpperCase()) ?? 'U';

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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="w-24 h-auto" />
            <div className="flex-grow" />
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          {isAdmin && (
              <div className="p-2 mb-2 rounded-md bg-sidebar-accent text-sidebar-accent-foreground flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4"/> Admin Mode
              </div>
          )}
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <MobileSheetClose>
                    <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            tooltip={item.label}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </MobileSheetClose>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent m-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL ?? ''} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user.displayName ?? 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={logout} aria-label="Log out">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
