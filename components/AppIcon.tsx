import React from "react";

interface IconProps {
  size?: number;
}

const AppIcon: React.FC<IconProps> = ({ size = 256 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect
        width="1024"
        height="1024"
        rx="220"
        fill="#111111"
      />

      {/* Glow */}
      <circle
        cx="512"
        cy="512"
        r="320"
        fill="#F4C430"
        opacity="0.08"
      />

      {/* Core pollen */}
      <circle
        cx="512"
        cy="512"
        r="120"
        fill="#F4C430"
      />

      {/* Particles */}
      <circle cx="512" cy="260" r="40" fill="#F4C430"/>
      <circle cx="760" cy="512" r="40" fill="#F4C430"/>
      <circle cx="512" cy="760" r="40" fill="#F4C430"/>
      <circle cx="260" cy="512" r="40" fill="#F4C430"/>

      {/* Orbit ring */}
      <circle
        cx="512"
        cy="512"
        r="260"
        stroke="#F4C430"
        strokeWidth="20"
        strokeDasharray="20 25"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
};

export default AppIcon;