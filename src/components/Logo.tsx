export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 50 50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Acoof Logo"
    >
        <path
            d="M25,2C12.85,2,3,11.85,3,24s9.85,22,22,22s22-9.85,22-22S37.15,2,25,2z M25,41c-9.37,0-17-7.63-17-17S15.63,7,25,7 s17,7.63,17,17S34.37,41,25,41z"
        />
        <path
            d="M26.47,34.4l-3.53-9.9h-5.87l-3.53,9.9h-4.33l9.07-25.6h4.33l9.07,25.6H26.47z M20.53,21.5h4.93L22.9,14.63 C22.9,14.63,20.53,21.5,20.53,21.5z"
        />
    </svg>
  );
}
