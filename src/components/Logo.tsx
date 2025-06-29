import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1000 300"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`
            .logo-text {
              font-family: 'Montserrat', sans-serif;
              font-weight: 900;
              font-size: 180px;
              fill: currentColor;
              letter-spacing: -10px;
            }
          `}
        </style>
      </defs>

      {/* Background shape */}
      <path
        d="M0 50 Q 50 0, 100 50 L 100 250 Q 50 300, 0 250 Z"
        fill="black"
      />
      <path
        d="M900 50 Q 950 0, 1000 50 L 1000 250 Q 950 300, 900 250 Z"
        fill="black"
      />

      {/* Text "Acoof" */}
      <text x="120" y="210" className="logo-text">Acoof</text>

      {/* Red accent lines */}
      <line x1="20" y1="150" x2="80" y2="150" stroke="hsl(var(--primary))" strokeWidth="20" strokeLinecap="round" />
      <line x1="920" y1="150" x2="980" y2="150" stroke="hsl(var(--primary))" strokeWidth="20" strokeLinecap="round" />

    </svg>
  );
}
