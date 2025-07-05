import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // The parent element will control the size via the className.
    // We add an aspect ratio to the container so that `fill` works correctly
    // even if only one dimension (e.g., height) is specified in the className.
    <div className={cn('relative aspect-square', className)} {...props}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/genkit-llm-76571.appspot.com/o/1474921b-683a-4dd3-9114-152e04b43445?alt=media&token=c27c6536-6c8c-49f4-ac3e-5b1233075c32"
        alt="White Wolf Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}
