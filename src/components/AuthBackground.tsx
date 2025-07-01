
'use client';

import { Shirt } from 'lucide-react';
import { useState, useEffect } from 'react';

const PantsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2v7" />
    <path d="M18.5 13a6 6 0 0 1-12 0" />
    <path d="M6.5 13V22" />
    <path d="M17.5 13V22" />
  </svg>
);


interface IconConfig {
  id: number;
  Icon: React.ElementType;
  style: React.CSSProperties;
}

const generateIcons = (count: number): IconConfig[] => {
  const icons = [];
  for (let i = 0; i < count; i++) {
    const IconComponent = Math.random() > 0.5 ? Shirt : PantsIcon;
    const size = Math.floor(Math.random() * 80) + 40; // size between 40px and 120px
    const rotation = Math.floor(Math.random() * 90) - 45; // rotation between -45 and 45 deg
    const top = `${Math.random() * 100}%`;
    const left = `${Math.random() * 100}%`;

    icons.push({
      id: i,
      Icon: IconComponent,
      style: {
        position: 'absolute',
        top,
        left,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotation}deg) translate(-50%, -50%)`,
        opacity: 0.05,
        color: 'white',
      },
    });
  }
  return icons;
};


export function AuthBackground() {
  const [icons, setIcons] = useState<IconConfig[]>([]);

  useEffect(() => {
    setIcons(generateIcons(30)); // Generate 30 icons
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {icons.map(({ id, Icon, style }) => (
        <Icon key={id} style={style} className="text-white" />
      ))}
    </div>
  );
}
