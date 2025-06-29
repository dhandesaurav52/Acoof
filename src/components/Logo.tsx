import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 145 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <style>
        {`
          .text-acoof-logo {
            font-family: Inter, sans-serif;
            font-size: 40px;
            font-weight: bold;
            fill: currentColor;
          }
          .bag-acoof-logo {
            fill: currentColor;
          }
          .bag-stroke-acoof-logo {
             stroke: currentColor;
          }
          .eyes-acoof-logo {
            fill: hsl(var(--background));
          }
          .smile-acoof-logo {
            stroke: hsl(var(--background));
          }

          .dark .eyes-acoof-logo {
            fill: hsl(var(--background));
          }
          .dark .smile-acoof-logo {
            stroke: hsl(var(--background));
          }
        `}
      </style>
      <text x="0" y="38" className="text-acoof-logo">AC</text>
      
      <g transform="translate(70, 0)">
        <path className="bag-acoof-logo" d="M2.5 12.5H37.5V42.5H2.5V12.5Z" />
        <path className="bag-stroke-acoof-logo" d="M12.5 12.5V5.5C12.5 2.46243 14.9624 0 18 0H22C25.0376 0 27.5 2.46243 27.5 5.5V12.5" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="14" cy="24" r="5" className="eyes-acoof-logo" />
        <circle cx="26" cy="24" r="5" className="eyes-acoof-logo" />
        <path d="M13 32C13 32 16 36 20 36C24 36 27 32 27 32" strokeWidth="2.5" strokeLinecap="round" fill="none" className="smile-acoof-logo" />
      </g>
      
      <text x="110" y="38" className="text-acoof-logo">F</text>
    </svg>
  );
}
