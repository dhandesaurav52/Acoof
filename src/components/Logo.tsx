import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ width, height, className }: { width: number; height: number; className?: string }) {
  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/Acoof%20Logo.png?alt=media&token=a722f806-57c7-409a-ac91-6d7dff0f9a67"
        alt="Acoof Logo"
        fill
        priority
        className="object-contain"
        sizes={`${width}px`}
      />
    </div>
  );
}
