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
      {/* glow background */}
      <circle cx="32" cy="32" r="26" fill="#F4C430" opacity="0.08" />

      {/* central pollen core */}
      <circle cx="32" cy="32" r="9" fill="#F4C430" />

      {/* inner particles */}
      <circle cx="32" cy="16" r="2.5" fill="#F4C430" />
      <circle cx="48" cy="32" r="2.5" fill="#F4C430" />
      <circle cx="32" cy="48" r="2.5" fill="#F4C430" />
      <circle cx="16" cy="32" r="2.5" fill="#F4C430" />

      {/* outer particles */}
      <circle cx="12" cy="20" r="2" fill="#F4C430" opacity="0.9" />
      <circle cx="52" cy="14" r="2" fill="#F4C430" opacity="0.8" />
      <circle cx="50" cy="50" r="2" fill="#F4C430" opacity="0.7" />
      <circle cx="14" cy="46" r="2" fill="#F4C430" opacity="0.8" />

      {/* orbit ring */}
      <circle
        cx="32"
        cy="32"
        r="18"
        stroke="#F4C430"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        opacity="0.5"
      />

      {/* signal arc (represents activity / logs / momentum) */}
      <path
        d="M20 10 A24 24 0 0 1 54 28"
        stroke="#F4C430"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
};

export default Logo;