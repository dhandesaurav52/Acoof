import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://placehold.co/145x50.png"
      width={145}
      height={50}
      alt="Acoof Logo"
      className={className}
      priority
      data-ai-hint="logo"
    />
  );
}
