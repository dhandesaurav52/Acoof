
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, User, Heart, Shield, ShoppingBag, Package, Download, LayoutGrid, LogOut, Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/lookbook", label: "Lookbook" },
];

const ADMIN_EMAIL = "admin@example.com";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { cartCount, loading: cartLoading } = useCart();
  const { installPromptEvent, triggerInstallPrompt } = useInstallPrompt();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };
  
  const handleInstallClick = () => {
    triggerInstallPrompt();
    setIsMenuOpen(false);
  };
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("flex items-center gap-6 text-sm font-medium", className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "transition-colors hover:text-primary",
            pathname === link.href ? "text-primary font-semibold" : "text-foreground/80",
          )}
          onClick={() => setIsMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
      {isMounted && installPromptEvent && (
        <button onClick={handleInstallClick} className={cn("transition-colors hover:text-primary flex items-center gap-2", className?.includes('flex-col') ? '' : 'text-foreground/80')}>
            <Download className="h-4 w-4" />
            <span>Install App</span>
        </button>
      )}
    </nav>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">My Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin && (
          <>
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin"><LayoutGrid className="mr-2 h-4 w-4" />Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/orders"><Package className="mr-2 h-4 w-4" />Orders</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/operate-store"><ShoppingBag className="mr-2 h-4 w-4" />Store</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/user"><LayoutGrid className="mr-2 h-4 w-4" />Profile</Link>
        </DropdownMenuItem>
        {!isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/user/orders"><Package className="mr-2 h-4 w-4" />My Orders</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/user/wishlist"><Heart className="mr-2 h-4 w-4" />Wishlist</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications"><Bell className="mr-2 h-4 w-4" />Notifications</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center">
          <Logo width={130} height={40} />
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-start gap-6">
          <NavLinks />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
           <div className="hidden md:flex items-center gap-2">
            {!isMounted || cartLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
             <Button variant="ghost" size="icon" asChild>
                <Link href="/cart" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                            {cartCount}
                        </span>
                    )}
                    <span className="sr-only">Shopping Cart</span>
                </Link>
             </Button>
            )}
             {!isMounted || authLoading ? (
               <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-24" />
                </div>
             ) : user ? (
                <>
                  {!isAdmin && (!isMounted || wishlistLoading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  ) : (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/dashboard/user/wishlist" className="relative">
                        <Heart className="h-5 w-5" />
                        {wishlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                {wishlist.length}
                            </span>
                        )}
                        <span className="sr-only">Wishlist</span>
                      </Link>
                    </Button>
                  ))}
                  <UserMenu />
                </>
             ) : (
                <>
                    <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </>
             )}
          </div>

          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Main navigation and account links</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <Link href="/" className="mb-8 flex items-center" onClick={() => setIsMenuOpen(false)}>
                    <Logo width={130} height={40} />
                  </Link>
                  <div className="flex flex-col items-start gap-3 text-base">
                    <NavLinks className="flex-col items-start gap-3 text-base"/>
                  </div>
                   <div className="mt-6 pt-4 border-t">
                    {!isMounted || cartLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <Link href="/cart" className="text-base flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                          <ShoppingCart className="h-5 w-5" />
                          <span>Cart ({cartCount})</span>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 mt-4 pt-4 border-t text-base">
                     {!isMounted || authLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-8 w-3/4" />
                        </div>
                     ) : user ? (
                       <>
                         <DropdownMenuLabel className="px-0 font-normal">My Account</DropdownMenuLabel>
                         <Link href="/dashboard/user" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><LayoutGrid className="h-5 w-5" />Profile</Link>
                         {!isAdmin && (
                          <>
                            <Link href="/dashboard/user/orders" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Package className="h-5 w-5" />My Orders</Link>
                            <Link href="/dashboard/user/wishlist" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Heart className="h-5 w-5" />Wishlist</Link>
                          </>
                         )}
                         <Link href="/dashboard/notifications" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Bell className="h-5 w-5" />Notifications</Link>
                         <Link href="/dashboard/settings" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Settings className="h-5 w-5" />Settings</Link>
                         
                         {isAdmin && (
                           <>
                             <DropdownMenuLabel className="px-0 font-normal pt-2 border-t">Admin</DropdownMenuLabel>
                             <Link href="/dashboard/admin" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><LayoutGrid className="h-5 w-5" />Dashboard</Link>
                             <Link href="/dashboard/admin/orders" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Package className="h-5 w-5" />Orders</Link>
                             <Link href="/dashboard/admin/operate-store" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><ShoppingBag className="h-5 w-5" />Store</Link>
                           </>
                         )}

                         <div className="mt-2 pt-2 border-t">
                            <button onClick={handleLogout} className="text-left w-full flex items-center gap-2">
                                <LogOut className="h-5 w-5"/>
                                Logout
                            </button>
                         </div>
                       </>
                     ) : (
                       <>
                        <Button variant="ghost" asChild className="w-full justify-start text-base">
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        </Button>
                        <Button asChild className="w-full justify-start text-base">
                            <Link href="/signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                        </Button>
                       </>
                     )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
