import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 280 60"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Acoof Logo"
    >
      <text
        x="0"
        y="50"
        className="logo-wordmark"
      >
        ACOOF
      </text>
    </svg>
  );
}
