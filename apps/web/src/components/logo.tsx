export function NodeHubLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="currentColor" />
      
      {/* Three stacked layers */}
      <path
        d="M16 8L24 12L16 16L8 12L16 8Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M8 16L16 20L24 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 20L16 24L24 20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
