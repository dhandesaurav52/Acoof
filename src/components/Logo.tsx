import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 968 361" 
      aria-label="Acoof Logo"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <style>
          {`
            .logo-text { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-weight: 900; 
              font-size: 250px;
              fill: white;
              letter-spacing: -15px;
            }
            .swaz-text {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-weight: 700;
              font-size: 45px;
              fill: white;
            }
            .domain-text {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-weight: 900;
              font-size: 120px;
              fill: black;
            }
          `}
        </style>
      </defs>
      
      {/* Red Background */}
      <rect width="968" height="361" fill="#D93025"/>
      
      {/* Bag shape behind the OOs */}
      <path d="M435 77h260l-25 180H460z" fill="black"/>
      <path d="M515 82a55 55 0 0 1 100 0" stroke="black" stroke-width="25" fill="none" transform="translate(0, -10)"/>
      <path d="M515 220a80 80 0 0 0 100 0" stroke="white" stroke-width="10" fill="none" stroke-linecap="round"/>

      {/* Main Text */}
      <text x="40" y="270" className="logo-text">
        <tspan>A</tspan>
        <tspan dx="5">C</tspan>
        <tspan dx="10">O</tspan>
        <tspan>O</tspan>
        <tspan>F</tspan>
      </text>

      {/* SWAZ Text inside C */}
      <text x="275" y="215" className="swaz-text">SWAZ</text>
      
      {/* .in Text */}
      <text x="800" y="270" className="domain-text">.in</text>
    </svg>
  );
}
