
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    // The parent element will control the size via the className.
    // Specifying both width and height in the className (e.g., 'h-10 w-10') is crucial
    // to prevent hydration errors with next/image.
    <div className={cn('relative', className)}>
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
