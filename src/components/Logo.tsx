import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 900 350"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`
            .acoof-text {
              font-family: 'Montserrat', sans-serif;
              font-weight: 800;
              font-size: 200px;
              fill: white;
            }
            .swaz-text {
              font-family: 'Montserrat', sans-serif;
              font-weight: 600;
              font-size: 50px;
              fill: white;
            }
            .in-text {
              font-family: 'Montserrat', sans-serif;
              font-weight: 800;
              font-size: 100px;
              fill: black;
            }
          `}
        </style>
      </defs>

      {/* Red background */}
      <rect width="900" height="350" fill="hsl(var(--primary))" />

      {/* Text "AC" */}
      <text x="20" y="250" className="acoof-text">AC</text>
      
      {/* Text "SWAZ" inside C */}
      <text x="215" y="180" className="swaz-text">SWAZ</text>

      {/* Shopping Bag */}
      <g transform="translate(380, 50)">
        {/* Bag body */}
        <path d="M0,20 L240,20 L210,240 L30,240 Z" fill="black" />
        {/* Bag handle */}
        <path d="M70,20 C70,-40 170,-40 170,20" stroke="black" strokeWidth="25" fill="none" />
        {/* Eyes (OO) */}
        <circle cx="85" cy="120" r="40" fill="white" />
        <circle cx="155" cy="120" r="40" fill="white" />
        {/* Smile */}
        <path d="M80,180 Q120,220 160,180" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" />
      </g>

      {/* Text "F" */}
      <text x="610" y="250" className="acoof-text">F</text>
      
      {/* Text ".in" */}
      <text x="750" y="250" className="in-text">.in</text>

    </svg>
  );
}
