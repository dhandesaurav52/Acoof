import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <div className={className}>
        <span className="font-bold text-xl tracking-tighter">MyApp</span>
    </div>
  );
}
