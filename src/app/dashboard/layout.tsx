
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Package,
  Settings,
  Heart,
  User as UserIcon,
  PlusCircle,
  LayoutDashboard,
  Home,
  Bell,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_EMAIL = 'admin@example.com';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const getInitials = (name: string, fallback: string) => {
    return name?.split(' ').map(n => n[0]).join('') || fallback;
  }

  const adminNav = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/orders', label: 'Manage Orders', icon: Package },
    { href: '/dashboard/admin/operate-store', label: 'Add Product', icon: PlusCircle },
  ];

  const userNav = [
    { href: '/dashboard/user', label: 'Profile', icon: UserIcon },
    { href: '/dashboard/user/orders', label: 'My Orders', icon: Package },
    { href: '/dashboard/user/wishlist', label: 'Wishlist', icon: Heart },
  ];
  
  const commonNav = [
     { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
     { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]
  
  const navItems = isAdmin ? adminNav : userNav;

  const getPageTitle = () => {
      const allNav = [...adminNav, ...userNav, ...commonNav];
      return allNav.find(item => pathname.startsWith(item.href))?.label || 'Dashboard';
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-14 items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
            <Logo className="h-10 w-auto group-data-[collapsible=icon]:hidden" />
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          
           <SidebarMenu className="mt-auto">
            {commonNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
               <SidebarMenuButton
                  asChild
                  tooltip={{
                    children: 'Back to Store',
                  }}
                >
                  <Link href="/">
                    <Home />
                    <span>Back to Store</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
            <SidebarMenuItem className="p-2 group-data-[collapsible=icon]:p-0">
               {loading || !user ? (
                 <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-24 group-data-[collapsible=icon]:hidden" />
                 </div>
               ) : (
                <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center gap-2 truncate">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                        <AvatarFallback>{getInitials(user.displayName ?? '', 'U')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm group-data-[collapsible=icon]:hidden">{user.displayName || 'User'}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:hidden" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                </div>
               )}
            </SidebarMenuItem>
           </SidebarMenu>

        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 flex items-center gap-4 md:hidden sticky top-0 bg-background/80 backdrop-blur-lg border-b z-10 -mx-4 px-4">
          <SidebarTrigger />
          <h2 className="font-semibold text-lg">
            {getPageTitle()}
          </h2>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
