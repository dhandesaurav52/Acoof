
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ width, height, className }: { width: number; height: number; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/Acoof%20Logo.png?alt=media&token=72b9e983-2eb5-4322-b1a6-b3a0e0500789"
        alt="White Wolf Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}
