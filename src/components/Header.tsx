
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/lookbook", label: "Lookbook" },
];

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("flex items-center gap-6 text-sm font-medium", className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "transition-colors hover:text-primary",
            pathname === link.href ? "text-primary" : "text-foreground/60",
          )}
          onClick={() => setIsMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center">
          <Logo className="h-8 w-auto text-foreground" />
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-start">
          <NavLinks />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
           <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="woman portrait" />
                    <AvatarFallback>SD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Sofia Davis</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      acoof@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user"><User className="mr-2 h-4 w-4" /><span>User Profile</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin"><LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/login"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="p-6">
                  <Link href="/" className="mb-8 flex items-center" onClick={() => setIsMenuOpen(false)}>
                    <Logo className="h-8 w-auto text-foreground" />
                  </Link>
                  <NavLinks className="flex-col items-start gap-4 text-lg"/>
                  <div className="flex flex-col gap-4 mt-8 pt-4 border-t">
                    <Button variant="ghost" asChild className="w-full justify-start text-lg">
                        <Link href="/dashboard/user" onClick={() => setIsMenuOpen(false)}>User Profile</Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start text-lg">
                        <Link href="/dashboard/admin" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
                    </Button>
                    <Button asChild className="w-full justify-start text-lg">
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>Logout</Link>
                    </Button>
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
