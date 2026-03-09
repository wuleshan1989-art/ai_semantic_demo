import React from 'react';

const AirsIcon = ({ size = 24, className }) => {
  const uniqueId = React.useId();
  const gradientId = `airs-ring-${uniqueId}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" /> {/* Soft Violet */}
          <stop offset="50%" stopColor="#60A5FA" /> {/* Soft Blue */}
          <stop offset="100%" stopColor="#22D3EE" /> {/* Soft Cyan */}
        </linearGradient>
      </defs>

      {/* Background Circle - Pure White */}
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" />

      {/* Gradient Ring Border - Extra Bold */}
      <circle 
        cx="50" 
        cy="50" 
        r="44" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="12" 
        strokeLinecap="round"
      />

      {/* Face Container - Extra Bold Features */}
      <g fill="#334155"> {/* Slate-700 */}
        {/* Left Eye - Large Dot */}
        <circle cx="36" cy="52" r="8" />
        
        {/* Right Eye - Bold Wink (< shape) */}
        <path 
          d="M68 44 L60 52 L68 60" 
          stroke="#334155" 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </g>

    </svg>
  );
};

export default AirsIcon;
