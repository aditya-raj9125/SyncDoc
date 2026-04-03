'use client';

import { useRef, useState, useCallback, useEffect, MouseEvent } from 'react';
import { PAGE_WIDTH, DEFAULT_MARGIN_LEFT, DEFAULT_MARGIN_RIGHT } from './PagedCanvas';

interface RulerProps {
  zoom?: number;
  marginLeft?: number;
  marginRight?: number;
  onMarginChange?: (side: 'left' | 'right', value: number) => void;
  visible?: boolean;
}

// Convert pixels to cm (at 96dpi, 1cm ≈ 37.8px)
const PX_PER_CM = 37.795275591;

export function Ruler({
  zoom = 100,
  marginLeft = DEFAULT_MARGIN_LEFT,
  marginRight = DEFAULT_MARGIN_RIGHT,
  onMarginChange,
  visible = true,
}: RulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);

  if (!visible) return null;

  const scaleFactor = zoom / 100;
  const rulerWidth = PAGE_WIDTH;
  const textAreaStart = marginLeft;
  const textAreaEnd = rulerWidth - marginRight;
  const totalCm = Math.ceil(rulerWidth / PX_PER_CM);

  // Generate tick marks
  const ticks: { x: number; label?: string; height: number }[] = [];
  for (let cm = 0; cm <= totalCm; cm++) {
    const x = cm * PX_PER_CM;
    if (x > rulerWidth) break;

    // Major tick every 1cm
    ticks.push({
      x,
      label: cm % 2 === 0 && cm > 0 ? `${cm}` : undefined,
      height: 10,
    });

    // Half tick
    const halfX = (cm + 0.5) * PX_PER_CM;
    if (halfX <= rulerWidth) {
      ticks.push({ x: halfX, height: 6 });
    }
  }

  const handleMouseDown = (side: 'left' | 'right') => (e: MouseEvent) => {
    e.preventDefault();
    setDragging(side);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const ruler = rulerRef.current;
      if (!ruler) return;

      const rect = ruler.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scaleFactor;

      if (dragging === 'left') {
        const newMargin = Math.max(20, Math.min(x, PAGE_WIDTH / 2 - 50));
        setDragX(newMargin);
      } else if (dragging === 'right') {
        const newMargin = Math.max(20, Math.min(PAGE_WIDTH - x, PAGE_WIDTH / 2 - 50));
        setDragX(PAGE_WIDTH - newMargin);
      }
    };

    const handleMouseUp = () => {
      if (dragging && dragX !== null) {
        const side = dragging;
        const value = side === 'left' ? dragX : PAGE_WIDTH - dragX;
        onMarginChange?.(side, Math.round(value));
      }
      setDragging(null);
      setDragX(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragX, scaleFactor, onMarginChange]);

  const currentMarginLeft = dragging === 'left' && dragX !== null ? dragX : marginLeft;
  const currentMarginRight = dragging === 'right' && dragX !== null ? PAGE_WIDTH - dragX : marginRight;

  return (
    <div className="flex justify-center" style={{ userSelect: 'none' }}>
      <div
        ref={rulerRef}
        className="relative overflow-hidden"
        style={{
          width: rulerWidth * scaleFactor,
          height: 24,
          transform: `scaleX(${scaleFactor})`,
          transformOrigin: 'center top',
        }}
      >
        {/* Ruler background */}
        <div className="absolute inset-0 flex">
          {/* Left margin zone */}
          <div
            style={{ width: currentMarginLeft }}
            className="bg-[#e8e8e8]"
          />
          {/* Text area zone */}
          <div
            style={{ width: PAGE_WIDTH - currentMarginLeft - currentMarginRight }}
            className="bg-white"
          />
          {/* Right margin zone */}
          <div
            style={{ width: currentMarginRight }}
            className="bg-[#e8e8e8]"
          />
        </div>

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: tick.x }}
          >
            <div
              className="bg-[var(--text-tertiary)]"
              style={{
                width: 1,
                height: tick.height,
              }}
            />
            {tick.label && (
              <span
                className="absolute text-[9px] text-[var(--text-tertiary)]"
                style={{
                  top: 1,
                  left: -4,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {tick.label}
              </span>
            )}
          </div>
        ))}

        {/* Left margin handle */}
        <div
          className="absolute bottom-0 cursor-col-resize z-10"
          style={{ left: currentMarginLeft - 5 }}
          onMouseDown={handleMouseDown('left')}
        >
          <svg width={10} height={8} viewBox="0 0 10 8" className="fill-[var(--text-secondary)]">
            <polygon points="5,0 10,8 0,8" />
          </svg>
        </div>

        {/* Right margin handle */}
        <div
          className="absolute bottom-0 cursor-col-resize z-10"
          style={{ left: PAGE_WIDTH - currentMarginRight - 5 }}
          onMouseDown={handleMouseDown('right')}
        >
          <svg width={10} height={8} viewBox="0 0 10 8" className="fill-[var(--text-secondary)]">
            <polygon points="5,0 10,8 0,8" />
          </svg>
        </div>

        {/* Bottom border */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--bg-border)]" />
      </div>
    </div>
  );
}
