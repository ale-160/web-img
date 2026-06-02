'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { loadImage, createCanvas, applyFilters } from '@/utils/canvas';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditPanelProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onApply: (imageData: string, width: number, height: number) => void;
}

export function EditPanel({ imageUrl, imageWidth, imageHeight, onApply }: EditPanelProps) {
  const { t } = useLanguage();
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [isFlippedV, setIsFlippedV] = useState(false);
  const originalImageRef = useRef<{ url: string; width: number; height: number } | null>(null);
  
  useEffect(() => {
    originalImageRef.current = { url: imageUrl, width: imageWidth, height: imageHeight };
  }, [imageUrl, imageWidth, imageHeight]);

  const handleApply = useCallback(async () => {
    if (!originalImageRef.current) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(originalImageRef.current.url);
      const blob = await response.blob();
      const img = await loadImage(blob);
      
      const { canvas, ctx } = createCanvas(img.width, img.height);
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (isFlippedH) ctx.scale(-1, 1);
      if (isFlippedV) ctx.scale(1, -1);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-img.width / 2, -img.height / 2);
      
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';
      
      let finalWidth = img.width;
      let finalHeight = img.height;
      if (rotation === 90 || rotation === 270) {
        finalWidth = img.height;
        finalHeight = img.width;
      }
      
      const { canvas: finalCanvas, ctx: finalCtx } = createCanvas(finalWidth, finalHeight);
      finalCtx.drawImage(canvas, 0, 0);
      
      const dataUrl = finalCanvas.toDataURL();
      onApply(dataUrl, finalWidth, finalHeight);
      toast.success(t('processing'));
    } catch (error) {
      toast.error('Edit failed');
    } finally {
      setIsProcessing(false);
    }
  }, [brightness, contrast, saturate, blur, rotation, isFlippedH, isFlippedV, onApply, t]);

  const handleRotate = useCallback((angle: number) => {
    setRotation((prev) => (prev + angle) % 360);
    setTimeout(handleApply, 50);
  }, [handleApply]);

  const handleFlipH = useCallback(() => {
    setIsFlippedH((prev) => !prev);
    setTimeout(handleApply, 50);
  }, [handleApply]);

  const handleFlipV = useCallback(() => {
    setIsFlippedV((prev) => !prev);
    setTimeout(handleApply, 50);
  }, [handleApply]);

  const handleSliderChange = useCallback(() => {
    setTimeout(handleApply, 150);
  }, [handleApply]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('rotate')}</label>
        <div className="flex gap-1">
          <button
            onClick={() => handleRotate(-90)}
            disabled={isProcessing}
            className="flex-1 py-2 rounded bg-muted hover:bg-muted/80 text-sm disabled:opacity-50"
          >
            -90°
          </button>
          <button
            onClick={() => handleRotate(90)}
            disabled={isProcessing}
            className="flex-1 py-2 rounded bg-muted hover:bg-muted/80 text-sm disabled:opacity-50"
          >
            +90°
          </button>
          <button
            onClick={() => handleRotate(180)}
            disabled={isProcessing}
            className="flex-1 py-2 rounded bg-muted hover:bg-muted/80 text-sm disabled:opacity-50"
          >
            180°
          </button>
        </div>
        <div className="text-xs text-center mt-1 text-muted-foreground">
          {rotation}°
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('flip')}</label>
        <div className="flex gap-1">
          <button
            onClick={handleFlipH}
            disabled={isProcessing}
            className={cn(
              'flex-1 py-2 rounded text-sm transition-colors',
              isFlippedH ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
              isProcessing && 'opacity-50'
            )}
          >
            {t('flipH')}
          </button>
          <button
            onClick={handleFlipV}
            disabled={isProcessing}
            className={cn(
              'flex-1 py-2 rounded text-sm transition-colors',
              isFlippedV ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
              isProcessing && 'opacity-50'
            )}
          >
            {t('flipV')}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('brightness')}: {brightness}%</label>
        <input
          type="range"
          min="0"
          max="200"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          onInput={handleSliderChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('contrast')}: {contrast}%</label>
        <input
          type="range"
          min="0"
          max="200"
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
          onInput={handleSliderChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('saturate')}: {saturate}%</label>
        <input
          type="range"
          min="0"
          max="200"
          value={saturate}
          onChange={(e) => setSaturate(Number(e.target.value))}
          onInput={handleSliderChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('blur')}: {blur}px</label>
        <input
          type="range"
          min="0"
          max="20"
          value={blur}
          onChange={(e) => setBlur(Number(e.target.value))}
          onInput={handleSliderChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
