import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const logoTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '250px',
    fill: 'white',
    letterSpacing: '-0.05em',
  };

  const swazTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: '60px',
    fill: 'white',
  };
  
  const inTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '80px',
    fill: 'black',
  };

  return (
    <svg
      viewBox="0 0 1000 300"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1000" height="300" fill="hsl(var(--primary))" />

      <text x="10" y="240" style={logoTextStyle}>AC</text>
      <text x="730" y="240" style={logoTextStyle}>F</text>
      
      <text x="255" y="165" style={swazTextStyle}>SWAZ</text>
      
      <text x="835" y="235" style={inTextStyle}>.in</text>
      
      <g transform="translate(420, 30)">
        <path d="M10,45 h280 l-20,200 H30z" fill="black"/>
        <path d="M80 50 a 70 70 0 0 1 140 0" stroke="black" strokeWidth="30" fill="none" />
        
        <circle cx="100" cy="150" r="45" fill="white" />
        <circle cx="200" cy="150" r="45" fill="white" />

        <path d="M110 210 a 40 40 0 0 0 80 0" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
