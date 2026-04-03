'use client';

import { useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { formatWordCount } from '@syncdoc/utils';
import { Minus, Plus } from 'lucide-react';

// A4 dimensions at 96dpi
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const DEFAULT_MARGIN_TOP = 96;
const DEFAULT_MARGIN_BOTTOM = 96;
const DEFAULT_MARGIN_LEFT = 76;
const DEFAULT_MARGIN_RIGHT = 76;
const PAGE_GAP = 24;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

interface PagedCanvasProps {
  children: ReactNode;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function PagedCanvas({ children, zoom: controlledZoom, onZoomChange }: PagedCanvasProps) {
  const [internalZoom, setInternalZoom] = useState(100);
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;

  const { wordCount } = useEditorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Content area height per page
  const contentHeight = PAGE_HEIGHT - DEFAULT_MARGIN_TOP - DEFAULT_MARGIN_BOTTOM;

  // Observe content height to determine page count
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const totalHeight = entry.contentRect.height;
        const pages = Math.max(1, Math.ceil(totalHeight / contentHeight));
        setPageCount(pages);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [contentHeight]);

  // Track current page based on scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scaledPageHeight = (PAGE_HEIGHT + PAGE_GAP) * (zoom / 100);
    const scrollTop = container.scrollTop;
    const page = Math.max(1, Math.min(pageCount, Math.ceil((scrollTop + 1) / scaledPageHeight)));
    setCurrentPage(page);
  }, [zoom, pageCount]);

  const handleZoomIn = () => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP));
  const handleZoomOut = () => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP));

  const scaleFactor = zoom / 100;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable page area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#E8E8E8' }}
      >
        <div
          className="mx-auto py-8"
          style={{
            width: PAGE_WIDTH * scaleFactor + 80, // extra padding
            minHeight: '100%',
          }}
        >
          {/* Pages */}
          <div
            className="mx-auto"
            style={{
              width: PAGE_WIDTH * scaleFactor,
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Single page container - the content flows and we visually break it */}
            <div
              className="relative"
              style={{
                width: PAGE_WIDTH,
                minHeight: PAGE_HEIGHT,
                background: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                paddingTop: DEFAULT_MARGIN_TOP,
                paddingBottom: DEFAULT_MARGIN_BOTTOM,
                paddingLeft: DEFAULT_MARGIN_LEFT,
                paddingRight: DEFAULT_MARGIN_RIGHT,
              }}
            >
              {/* Content wrapper */}
              <div ref={contentRef}>
                {children}
              </div>
            </div>

            {/* Additional pages for overflow content */}
            {pageCount > 1 && (
              <div className="mt-6">
                {Array.from({ length: pageCount - 1 }, (_, i) => (
                  <div
                    key={i + 1}
                    style={{
                      width: PAGE_WIDTH,
                      height: PAGE_HEIGHT,
                      background: 'white',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                      marginBottom: PAGE_GAP,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between border-t border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs text-[var(--text-tertiary)]">
        {/* Left: Page indicator */}
        <span>
          Page {currentPage} of {pageCount}
        </span>

        {/* Center: Word count */}
        <span>{formatWordCount(wordCount)} words</span>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="rounded p-0.5 hover:bg-[var(--bg-elevated)] disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="min-w-[40px] text-center rounded px-1.5 py-0.5 hover:bg-[var(--bg-elevated)]"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="rounded p-0.5 hover:bg-[var(--bg-elevated)] disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { PAGE_WIDTH, PAGE_HEIGHT, DEFAULT_MARGIN_TOP, DEFAULT_MARGIN_BOTTOM, DEFAULT_MARGIN_LEFT, DEFAULT_MARGIN_RIGHT };
