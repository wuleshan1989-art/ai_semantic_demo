import React from 'react';

const Logo = ({ size = 40, className }) => {
  const uniqueId = React.useId();
  const gradientId = `logo-gradient-${uniqueId}`;

  // Tech/Knowledge focused gradient (Blue to Cyan)
  const colorStart = "#3b82f6"; // Blue-500
  const colorEnd = "#06b6d4";   // Cyan-500

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
          <stop offset="0%" stopColor={colorStart} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>
      </defs>

      {/* 核心知识点 - 稍微变大一点 */}
      <circle cx="50" cy="50" r="16" fill={`url(#${gradientId})`} opacity="0.9" />

      {/* 极简连接线 - 构成类似神经网络或分子结构的形状 */}
      <path 
        d="M50 34 V18 M50 66 V82 M34 50 H18 M66 50 H82 M40 40 L28 28 M60 60 L72 72 M40 60 L28 72 M60 40 L72 28" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="5" 
        strokeLinecap="round" 
        opacity="0.8"
      />

      {/* 外围节点 - 纯色圆点 */}
      <circle cx="18" cy="18" r="5" fill={colorStart} />
      <circle cx="82" cy="18" r="5" fill={colorEnd} />
      <circle cx="18" cy="82" r="5" fill={colorEnd} />
      <circle cx="82" cy="82" r="5" fill={colorStart} />

    </svg>
  );
};

export default Logo;
