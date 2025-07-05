import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  // Define styles as objects for better readability
  const logoTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '300px',
    fill: 'white',
    letterSpacing: '-0.02em',
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
    fontSize: '110px',
    fill: 'black',
  };

  return (
    <svg
      viewBox="0 0 1024 538"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="538" fill="#D83E34" />

      <g style={logoTextStyle}>
        <text x="40" y="410">A</text>
        <text x="210" y="410">C</text>
        <text x="700" y="410">F</text>
      </g>
      
      <text x="265" y="345" style={swazTextStyle}>SWAZ</text>
      
      <text x="830" y="410" style={inTextStyle}>.in</text>

      <g>
        {/* Bag Body */}
        <path d="M435 150 L410 420 L680 420 L655 150 Z" fill="black"/>
        
        {/* Bag Handle */}
        <path d="M490 100 C 490 40, 590 40, 590 100" stroke="black" strokeWidth="40" fill="none"/>
        <path d="M490 100 C 490 55, 590 55, 590 100" stroke="#D83E34" strokeWidth="20" fill="none"/>
        
        {/* Eyes (OOs) */}
        <circle cx="495" cy="280" r="60" fill="white"/>
        <circle cx="595" cy="280" r="60" fill="white"/>
        
        {/* Smile */}
        <path d="M500 370 Q545 410 590 370" stroke="white" strokeWidth="15" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
