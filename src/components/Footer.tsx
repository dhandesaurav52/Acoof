export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container flex flex-col items-center justify-center gap-2 py-8 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {new Date().getFullYear()} Urban Attire. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
