import React from 'react';

interface KudjoLogoProps {
  className?: string;
  light?: boolean; // if true, uses dark brown for UDJ/tagline instead of white/ivory
  width?: string | number;
  height?: string | number;
}

export default function KudjoLogo({
  className = '',
  light = false,
  width = 180,
  height = 46,
}: KudjoLogoProps) {
  const udjColor = light ? '#5a3d28' : '#ffffff';
  const tagColor = light ? '#5a3d28' : '#ffffff';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 90"
      width={width}
      height={height}
      className={className}
      aria-label="Kudjo - Trading Card Store & Auctions"
    >
      {/* K Stem */}
      <rect x="15" y="12" width="10" height="50" rx="1.5" fill="#dfae0b" />
      
      {/* K Upper Wing (lightning bolt top) */}
      <polygon points="23,38 58,10 44,42" fill="#dfae0b" />
      
      {/* K Lower Wing (lightning bolt bottom, yellow portion) */}
      <polygon points="23,41 40,44 46,51 34,49" fill="#dfae0b" />
      
      {/* K Lower Wing (lightning bolt bottom, brown tip portion) */}
      <polygon points="34,49 46,51 54,62 42,62" fill="#8f5533" />
      
      {/* UDJ text (bold geometric letters) */}
      <text
        x="66"
        y="54"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="48"
        fill={udjColor}
        letterSpacing="-1.5"
      >
        UDJ
      </text>
      
      {/* O target / pokeball circles */}
      <circle cx="190" cy="37" r="23" fill="#dfae0b" />
      <circle cx="190" cy="37" r="15.5" fill="#e11b22" />
      <circle cx="190" cy="37" r="9.5" fill="#dfae0b" />
      
      {/* Tagline */}
      <text
        x="15"
        y="78"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="9.5"
        fill={tagColor}
        letterSpacing="2.8"
      >
        TRADING CARD STORE <tspan fill="#e11b22">&amp;</tspan> AUCTIONS
      </text>
    </svg>
  );
}
