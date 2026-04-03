'use client';

import { motion } from 'framer-motion';

interface UserCursorProps {
  name: string;
  color: string;
  x: number;
  y: number;
}

export function UserCursor({ name, color, x, y }: UserCursorProps) {
  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      initial={false}
      animate={{ x, y }}
      transition={{ type: 'spring', damping: 30, stiffness: 500 }}
    >
      {/* Cursor SVG */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.928711 0.0712891L15.0713 8.78571L8.14285 10L5.21428 18.2857L0.928711 0.0712891Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      {/* Name label */}
      <div
        className="ml-3 -mt-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </motion.div>
  );
}
