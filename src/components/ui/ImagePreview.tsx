'use client';

import { useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { formatFileSize } from '@/utils/file';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  label?: string;
  onRemove?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  showCanvas?: boolean;
}

export function ImagePreview({
  src,
  alt = 'Preview',
  width,
  height,
  size,
  label,
  onRemove,
  canvasRef,
  showCanvas = false,
}: ImagePreviewProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div className="relative flex flex-col h-full">
      {label && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-sm font-medium">{label}</span>
          {size && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(size)}
            </span>
          )}
        </div>
      )}
      
      <div className="relative flex-1 overflow-auto bg-muted/20 scrollbar-thin">
        {showCanvas && canvasRef?.current ? (
          <canvas
            ref={canvasRef as React.RefObject<HTMLCanvasElement>}
            className="max-w-full max-h-full mx-auto"
          />
        ) : (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="max-w-full max-h-full mx-auto object-contain"
            style={{ display: 'block' }}
          />
        )}
        
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {(width || height) && (
        <div className="flex items-center justify-center gap-4 px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          {width && <span>{width}px</span>}
          {width && height && <span>×</span>}
          {height && <span>{height}px</span>}
        </div>
      )}
    </div>
  );
}
