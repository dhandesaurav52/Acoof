
import * as React from 'react';
import { useState, useEffect } from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <svg
      viewBox="0 0 480 60"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="White Wolf Logo"
      suppressHydrationWarning
    >
      {isMounted && (
        <text
          x="0"
          y="50"
          className="logo-wordmark"
        >
          WHITE WOLF
        </text>
      )}
    </svg>
  );
}
