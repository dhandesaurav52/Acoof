
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // The parent element will control the size via the className.
    // We add an aspect ratio to the container so that `fill` works correctly
    // even if only one dimension (e.g., height) is specified in the className.
    <div className={cn('relative aspect-[260/80]', className)} {...props}>
      <Image
        src="https://placehold.co/260x80.png"
        alt="White Wolf Logo"
        fill
        priority
        className="object-contain"
        data-ai-hint="wolf logo"
      />
    </div>
  );
}
