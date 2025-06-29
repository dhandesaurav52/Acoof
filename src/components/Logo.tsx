import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const acoofTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 800,
    fontSize: '200px',
    fill: 'white',
  };

  const swazTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: '50px',
    fill: 'white',
  };

  const inTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 800,
    fontSize: '100px',
    fill: 'black',
  };

  return (
    <svg
      viewBox="0 0 900 350"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red background */}
      <rect width="900" height="350" fill="hsl(var(--primary))" />

      {/* Text "AC" */}
      <text x="20" y="250" style={acoofTextStyle}>AC</text>
      
      {/* Text "SWAZ" inside C */}
      <text x="215" y="180" style={swazTextStyle}>SWAZ</text>

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
        <path d="M80,180 Q120,220 160,180" stroke="white" strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>

      {/* Text "F" */}
      <text x="610" y="250" style={acoofTextStyle}>F</text>
      
      {/* Text ".in" */}
      <text x="750" y="250" style={inTextStyle}>.in</text>

    </svg>
  );
}
