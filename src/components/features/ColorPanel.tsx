'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { loadImage, replaceColor, createCanvas, canvasToDataUrl } from '@/utils/canvas';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ColorPanelProps {
  imageUrl: string;
  onApply: (imageData: string, width: number, height: number) => void;
}

export function ColorPanel({ imageUrl, onApply }: ColorPanelProps) {
  const { t } = useLanguage();
  const [targetColor, setTargetColor] = useState('#FF0000');
  const [replacementColor, setReplacementColor] = useState('#00FF00');
  const [tolerance, setTolerance] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'replace' | 'picker'>('replace');
  const [isActive, setIsActive] = useState(false);
  const applyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const handlePickColor = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const rect = img.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`.toUpperCase();

    setTargetColor(hex);
    toast.success(`Picked: ${hex}`);
  }, []);

  const performReplace = useCallback(async () => {
    if (!isActive) return;

    setIsProcessing(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const img = await loadImage(blob);

      const { canvas, ctx } = createCanvas(img.width, img.height);
      ctx.drawImage(img, 0, 0);

      const target = hexToRgb(targetColor);
      const replacement = hexToRgb(replacementColor);

      replaceColor(ctx, target, replacement, tolerance);

      const dataUrl = canvasToDataUrl(canvas);
      onApply(dataUrl, img.width, img.height);
    } catch (error) {
      toast.error('Color replace failed');
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, targetColor, replacementColor, tolerance, isActive, onApply]);

  const debouncedApply = useCallback(() => {
    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
    }
    applyTimeoutRef.current = setTimeout(() => {
      void performReplace();
    }, 200);
  }, [performReplace]);

  useEffect(() => {
    if (isActive) {
      debouncedApply();
    }
    return () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    };
  }, [targetColor, replacementColor, tolerance, isActive, debouncedApply]);

  const toggleActive = useCallback(() => {
    setIsActive(!isActive);
    if (isActive) {
      // 如果关闭，需要重置预览为原始图片
      const resetImage = async () => {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const img = await loadImage(blob);
          const { canvas, ctx } = createCanvas(img.width, img.height);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvasToDataUrl(canvas);
          onApply(dataUrl, img.width, img.height);
        } catch (error) {
          console.error('Failed to reset image', error);
        }
      };
      void resetImage();
    }
  }, [isActive, imageUrl, onApply]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
        <button
          onClick={() => setMode('replace')}
          className={cn(
            'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'replace' ? 'bg-background shadow' : ''
          )}
        >
          一键替换
        </button>
        <button
          onClick={() => setMode('picker')}
          className={cn(
            'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'picker' ? 'bg-background shadow' : ''
          )}
        >
          取色器
        </button>
      </div>

      <button
        onClick={toggleActive}
        disabled={isProcessing}
        className={cn(
          'w-full py-2.5 rounded-lg font-medium text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isActive ? '取消替换' : (isProcessing ? t('processing') : '开始替换')}
      </button>

      {mode === 'picker' && (
        <div className="relative">
          <label className="block text-sm font-medium mb-2">点击图片取色</label>
          <div className="relative border rounded overflow-hidden">
            <img
              src={imageUrl}
              alt="Picker"
              className="w-full cursor-crosshair"
              onClick={handlePickColor}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2">{t('targetColor')}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={targetColor}
              onChange={(e) => setTargetColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={targetColor}
              onChange={(e) => setTargetColor(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded border border-input bg-background text-sm uppercase"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('replacementColor')}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={replacementColor}
              onChange={(e) => setReplacementColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={replacementColor}
              onChange={(e) => setReplacementColor(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded border border-input bg-background text-sm uppercase"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('tolerance')}: {tolerance}</label>
        <input
          type="range"
          min="1"
          max="100"
          value={tolerance}
          onChange={(e) => setTolerance(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>精确</span>
          <span>模糊</span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        💡 点击"开始替换"按钮启用颜色替换，调整参数会实时生效
      </div>
    </div>
  );
}
