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
      {/* pollen nucleus */}
      <circle cx="32" cy="32" r="7" fill="#E6B800" />

      {/* flowing pollen motion arc */}
      <path
        d="M14 36c3-12 16-20 28-16"
        stroke="#E6B800"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* secondary motion arc */}
      <path
        d="M20 46c8 6 20 6 28-2"
        stroke="#E6B800"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* seed particle */}
      <circle cx="46" cy="18" r="3" fill="#E6B800" opacity="0.9" />

      {/* subtle secondary particle */}
      <circle cx="18" cy="28" r="2.3" fill="#E6B800" opacity="0.7" />
    </svg>
  );
};

export default Logo;