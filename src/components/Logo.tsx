import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const logoTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '250px',
    fill: 'currentColor',
    letterSpacing: '-0.05em',
  };

  const inTextStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '80px',
    fill: 'currentColor',
  };

  return (
    <svg
      viewBox="0 0 1000 300"
      className={className}
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="10" y="240" style={logoTextStyle}>ACOOF</text>
      <text x="835" y="235" style={inTextStyle}>.in</text>
    </svg>
  );
}
