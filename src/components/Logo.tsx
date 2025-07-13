import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ width, height, className }: { width: number; height: number; className?: string }) {
  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.appspot.com/o/Acoof%20Logo.png?alt=media&token=72b9e983-2eb5-4322-b1a6-b3a0e0500789"
        alt="Urban Attire Lookbook Logo"
        fill
        priority
        className="object-contain"
        sizes={`${width}px`}
      />
    </div>
  );
}
