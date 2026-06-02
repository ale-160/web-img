'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { convertImage, ImageFormat, IMAGE_FORMATS, loadImage } from '@/utils/canvas';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConvertPanelProps {
  imageUrl: string;
  onApply: (imageData: string, width: number, height: number) => void;
}

export function ConvertPanel({ imageUrl, onApply }: ConvertPanelProps) {
  const { t } = useLanguage();
  const [format, setFormat] = useState<ImageFormat>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const originalImageRef = useRef<string>(imageUrl);
  
  useEffect(() => {
    originalImageRef.current = imageUrl;
  }, [imageUrl]);

  const handleFormatClick = useCallback(async (newFormat: ImageFormat) => {
    setFormat(newFormat);
    setIsProcessing(true);
    try {
      const response = await fetch(originalImageRef.current);
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });

      const converted = await convertImage(file, newFormat);
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(converted);
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      onApply(dataUrl, img.width, img.height);
      toast.success(`Converted to ${newFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onApply]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('targetFormat')}</label>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFormatClick(f.id)}
              disabled={isProcessing}
              className={cn(
                'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                format === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div>{f.name}</div>
              <div className="text-xs opacity-70">.{f.extension}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>💡</span>
          <span>转换图片格式不影响画质，仅改变编码方式</span>
        </div>
      </div>
    </div>
  );
}
