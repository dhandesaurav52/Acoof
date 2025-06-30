
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, User, Heart } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";

const defaultNavLinks = [
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
      ...defaultNavLinks,
      ...(user?.email === ADMIN_EMAIL ? [{ href: "/dashboard/admin/operate-store", label: "Operate Store" }] : [])
  ];

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

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
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.email === ADMIN_EMAIL ? (
            <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user">Your profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin">Admin Dashboard</Link>
                </DropdownMenuItem>
            </>
        ) : (
            <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user">Your profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user/orders">Your orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user/wishlist">Wishlist</Link>
                </DropdownMenuItem>
            </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications">Notifications</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-6 flex items-center">
          <Logo className="h-10 w-auto text-primary" />
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-start">
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
                  {!isMounted || wishlistLoading ? (
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
                  )}
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
                <div className="p-6">
                  <Link href="/" className="mb-8 flex items-center" onClick={() => setIsMenuOpen(false)}>
                    <Logo className="h-10 w-auto" />
                  </Link>
                  <NavLinks className="flex-col items-start gap-4 text-lg"/>
                   <div className="mt-8 pt-4 border-t">
                    {!isMounted || cartLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <Link href="/cart" className="text-lg flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                          <ShoppingCart className="h-5 w-5" />
                          <span>Cart ({cartCount})</span>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 mt-4 pt-4 border-t">
                     {!isMounted || authLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-8 w-3/4" />
                        </div>
                     ) : user ? (
                       <>
                        {user.email === ADMIN_EMAIL ? (
                            <>
                                <Link href="/dashboard/user" className="text-lg" onClick={() => setIsMenuOpen(false)}>Your profile</Link>
                                <Link href="/dashboard/admin" className="text-lg" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard/user" className="text-lg" onClick={() => setIsMenuOpen(false)}>Your profile</Link>
                                <Link href="/dashboard/user/orders" className="text-lg" onClick={() => setIsMenuOpen(false)}>Your orders</Link>
                                {!isMounted || wishlistLoading ? (
                                  <Skeleton className="h-8 w-32" />
                                ): (
                                  <Link href="/dashboard/user/wishlist" className="text-lg flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                    Wishlist ({wishlist.length})
                                  </Link>
                                )}
                            </>
                        )}
                        <Link href="/dashboard/notifications" className="text-lg" onClick={() => setIsMenuOpen(false)}>Notifications</Link>
                        <Link href="/dashboard/settings" className="text-lg" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                        <button onClick={handleLogout} className="text-lg text-left">Logout</button>
                       </>
                     ) : (
                       <>
                        <Button variant="ghost" asChild className="w-full justify-start text-lg">
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        </Button>
                        <Button asChild className="w-full justify-start text-lg">
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
