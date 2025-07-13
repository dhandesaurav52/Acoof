
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ width, height, className }: { width: number; height: number; className?: string }) {
  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.appspot.com/o/urban-attire-logo.png?alt=media&token=c2d58435-0840-4286-8488-75e11f912a77"
        alt="Urban Attire Logo"
        fill
        priority
        className="object-contain"
        sizes={`${width}px`}
      />
    </div>
  );
}
