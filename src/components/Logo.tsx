
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // The parent element will control the size via the className.
    // We add an aspect ratio to the container so that `fill` works correctly
    // even if only one dimension (e.g., height) is specified in the className.
    <div className={cn('relative aspect-square', className)} {...props} suppressHydrationWarning>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/74c364fd-44c0-4461-873a-9ac7b928858f.png?alt=media&token=80f76b0f-9511-4ed7-90f1-1808bf810e37"
        alt="White Wolf Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}
