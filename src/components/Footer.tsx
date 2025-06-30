
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Logo className="h-12 w-auto" />
            <p className="text-sm text-muted-foreground">
              Style Redefined. Dress with confidence.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3">
              <div className="space-y-4">
                <h4 className="font-semibold font-headline">Shop</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">New Arrivals</Link>
                  <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">Shirts</Link>
                  <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">Pants</Link>
                  <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">Shoes</Link>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold font-headline">About</h4>
                <div className="flex flex-col gap-2">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Our Story</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Press</Link>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold font-headline">Support</h4>
                <div className="flex flex-col gap-2">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Shipping & Returns</Link>
                </div>
              </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              © {new Date().getFullYear()} Acoof. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">Payments accepted:</p>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-6 bg-muted rounded-md flex items-center justify-center text-xs">Visa</div>
                    <div className="w-10 h-6 bg-muted rounded-md flex items-center justify-center text-xs">MC</div>
                    <div className="w-10 h-6 bg-muted rounded-md flex items-center justify-center text-xs">Amex</div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
