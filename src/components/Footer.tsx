
'use client';

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Facebook, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function Footer() {
  const [year, setYear] = useState<number>();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-secondary">
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Logo width={156} height={48} />
            <p className="text-sm text-muted-foreground pr-8">
              Style Redefined. Dress with confidence.
            </p>
             <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Join Our Newsletter</h4>
                <p className="text-sm text-muted-foreground">Get exclusive updates and offers straight to your inbox.</p>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="email" placeholder="Email" />
                    <Button type="submit">Subscribe</Button>
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-8">
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-sm text-muted-foreground hover:text-primary text-left">Our Story</button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Our Story</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-96 pr-6">
                        <div className="space-y-4 text-sm text-muted-foreground">
                          <p>The story of Acoof began not in a bustling city boardroom, but in a quiet, unassuming workshop in 2010. It was there that our founder, a tailor with a singular vision, embarked on a journey to redefine modern apparel. Armed with little more than a sketchbook, a vintage sewing machine, and an unwavering belief in the power of craftsmanship, the first seeds of Acoof were sown.</p>
                          <p>In those early days, the brand was a one-person operation. Every design was sketched by hand, every pattern was meticulously cut, and every garment was stitched with a level of care that has become our hallmark. The philosophy was simple: create clothing that was not only stylish and contemporary but also timeless and durable. It was about moving beyond the fleeting trends of fast fashion to build a collection of essentials that people could live in, rely on, and love for years to come. The name 'Acoof' itself was inspired by the spirit of the noble lone wolf—a symbol of strength, independence, and quiet confidence.</p>
                          <p>Our first collection consisted of just a handful of pieces: a perfectly tailored white shirt, a pair of rugged denim jeans, and a soft, versatile hoodie. These weren't just clothes; they were statements of intent. They represented a commitment to quality materials, ethical sourcing, and a design process that valued substance over spectacle. Word began to spread through the local community, not through splashy marketing campaigns, but through the quiet endorsement of those who wore our clothes. They spoke of the exceptional fit, the feel of the premium fabrics, and the subtle details that set Acoof apart.</p>
                          <p>As demand grew, so did our small team. We brought on like-minded artisans and designers who shared our founder's passion for quality and integrity. We moved from the small workshop to a larger studio, but we carried the spirit of that first space with us. Every decision, from the choice of a button to the selection of a new fabric supplier, was made with our core values in mind. We resisted the temptation to cut corners for the sake of profit, instead investing in sustainable practices and fostering relationships with suppliers who shared our commitment to ethical production.</p>
                          <p>The years that followed saw Acoof evolve from a local secret into a recognized name in independent fashion. Our collections expanded to include a full range of menswear, from smart-casual shirts to durable outerwear and essential accessories. Yet, as we grew, our founding principles remained our North Star. We continued to draw inspiration from the world around us—from the clean lines of modern architecture to the raw beauty of the natural world—translating these influences into clothing that was both functional and effortlessly cool.</p>
                          <p>Today, more than a decade since that first stitch was sewn, Acoof stands as a testament to the enduring power of a simple idea. We are a collective of creators, dreamers, and craftsmen dedicated to making exceptional clothing for the modern individual. We believe that what you wear is an extension of who you are, and our mission is to provide you with the pieces to tell your own story. Every garment we create is still infused with the same passion and precision as that first white shirt from 2010. It's a legacy of quality, a celebration of style, and a promise we make to every customer who chooses to be a part of our journey. Thank you for joining us.</p>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Press</Link>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold font-headline">Support</h4>
                <div className="flex flex-col gap-2">
                   <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-sm text-muted-foreground hover:text-primary text-left">Contact Us</button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Contact Information</DialogTitle>
                        <DialogDescription>
                          You can reach us via phone or email below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-2 pt-4">
                        <p className="text-lg font-mono font-semibold text-primary tracking-widest">+917447885505</p>
                        <p className="text-lg text-primary">contact@acoof.com</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Shipping & Returns</Link>
                </div>
              </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex gap-4">
              <a href="https://m.facebook.com/acoof.in/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/acoof/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <p className="text-center text-sm leading-loose text-muted-foreground md:order-first" suppressHydrationWarning>
              © {year} Acoof. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
