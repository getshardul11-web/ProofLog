import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 28, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Core pollen sphere */}
      <circle cx="32" cy="32" r="12" fill="#F4C430" />

      {/* Orbit particles */}
      <circle cx="50" cy="28" r="3" fill="#F4C430" opacity="0.9" />
      <circle cx="18" cy="18" r="2.5" fill="#F4C430" opacity="0.7" />
      <circle cx="20" cy="46" r="2.5" fill="#F4C430" opacity="0.8" />
      <circle cx="46" cy="44" r="2" fill="#F4C430" opacity="0.6" />

      {/* subtle ring */}
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="#F4C430"
        strokeWidth="1.5"
        opacity="0.25"
      />
    </svg>
  );
};

export default Logo;