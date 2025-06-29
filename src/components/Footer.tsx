
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Logo className="h-10 w-auto" />
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Style Redefined.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
            Facebook
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
            Instagram
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
            Twitter
          </Link>
        </div>
      </div>
      <div className="bg-secondary/80 py-4">
        <div className="container">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © {new Date().getFullYear()} Acoof. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
