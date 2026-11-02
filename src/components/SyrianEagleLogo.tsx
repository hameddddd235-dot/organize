// src/components/SyrianEagleLogo.tsx
import React from 'react';

interface SyrianEagleLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const SyrianEagleLogo: React.FC<SyrianEagleLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size]} shrink-0 relative flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-syria-card via-syria-navy to-slate-950 border border-syria-borderGold shadow-lg shadow-syria-gold/10`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(197,160,89,0.35)]"
        >
          <defs>
            {/* Syrian Sovereign Gold Gradient */}
            <linearGradient id="syriaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCEFC7" />
              <stop offset="35%" stopColor="#DFBA55" />
              <stop offset="70%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#8F6E26" />
            </linearGradient>

            {/* Dark Accent Gradient */}
            <linearGradient id="syriaGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#5E4716" />
            </linearGradient>

            {/* Star Glow */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Three Stars in an Arch - Representing the National Revolution & Sovereign Stars */}
          <g filter="url(#goldGlow)">
            {/* Center Star */}
            <polygon
              points="60,8 62.5,14 69,14 63.5,18 65.5,24 60,20.5 54.5,24 56.5,18 51,14 57.5,14"
              fill="url(#syriaGold)"
            />
            {/* Left Star */}
            <polygon
              points="40,14 42,19.5 48,19 43.5,23 45,28.5 40,25.5 35,28.5 36.5,23 32,19 38,19.5"
              fill="url(#syriaGold)"
            />
            {/* Right Star */}
            <polygon
              points="80,14 82,19.5 88,19 83.5,23 85,28.5 80,25.5 75,28.5 76.5,23 72,19 78,19.5"
              fill="url(#syriaGold)"
            />
          </g>

          {/* Golden Eagle Body & Head - Modern Minimalist Geometric Style */}
          <g>
            {/* Eagle Head & Beak facing left */}
            <path
              d="M60 25 C58 25 53 26 49 28 C45 30 42 34 40 37 C37 38 34 38 31 39 C33 41 36 41 38 42 C38 44 40 47 43 49 C46 51 52 52 60 52 C68 52 74 51 77 49 C80 47 82 44 82 42 C84 41 87 41 89 39 C86 38 83 38 80 37 C78 34 75 30 71 28 C67 26 62 25 60 25 Z"
              fill="url(#syriaGold)"
            />

            {/* Left Wing (7 primary feathers representing governorates) */}
            <path
              d="M48 40 L28 22 C26 27 27 34 30 38 L16 31 C15 36 17 43 21 47 L10 44 C10 50 13 56 18 60 L8 59 C9 65 13 71 19 75 L12 76 C14 82 19 87 26 89 L38 78 L46 62 Z"
              fill="url(#syriaGold)"
            />

            {/* Right Wing (7 primary feathers representing governorates - Total 14 feathers) */}
            <path
              d="M72 40 L92 22 C94 27 93 34 90 38 L104 31 C105 36 103 43 99 47 L110 44 C110 50 107 56 102 60 L112 59 C111 65 107 71 101 75 L108 76 C106 82 101 87 94 89 L82 78 L74 62 Z"
              fill="url(#syriaGold)"
            />

            {/* Central Chest & Shield Emblem */}
            <path
              d="M60 48 C51 48 46 54 46 66 C46 80 54 94 60 100 C66 94 74 80 74 66 C74 54 69 48 60 48 Z"
              fill="url(#syriaGoldDark)"
              stroke="url(#syriaGold)"
              strokeWidth="2"
            />

            {/* Shield Core Line */}
            <path
              d="M60 52 L60 95"
              stroke="url(#syriaGold)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Tail - 5 distinct geometric feathers representing the 5 Syrian geographical regions */}
            <g fill="url(#syriaGold)">
              {/* Central tail feather */}
              <polygon points="60,98 56,114 60,117 64,114" />
              {/* Inner Left feather */}
              <polygon points="54,97 49,112 53,114 56,99" />
              {/* Inner Right feather */}
              <polygon points="66,97 71,112 67,114 64,99" />
              {/* Outer Left feather */}
              <polygon points="49,94 43,108 47,110 51,96" />
              {/* Outer Right feather */}
              <polygon points="71,94 77,108 73,110 69,96" />
            </g>

            {/* Eye of the Eagle */}
            <circle cx="44" cy="35" r="1.5" fill="#070C15" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold tracking-wider text-syria-gold uppercase">
            الجمهورية العربية السورية
          </span>
          <span className="text-xs font-semibold text-slate-300">
            الهوية البصرية الرسمية المعتمدة
          </span>
        </div>
      )}
    </div>
  );
};
