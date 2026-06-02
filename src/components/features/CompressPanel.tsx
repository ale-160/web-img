'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { compressImage, ImageFormat, IMAGE_FORMATS, loadImage, createCanvas } from '@/utils/canvas';
import { formatFileSize } from '@/utils/file';
import { sizePresets, exportFormats, ExportFormat } from '@/data/presets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CompressPanelProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  onApply: (imageData: string, width: number, height: number) => void;
  initialFormat?: ExportFormat;
  onFormatChange?: (format: ExportFormat) => void;
}

export function CompressPanel({ imageUrl, imageWidth, imageHeight, imageSize, onApply, initialFormat = 'jpeg', onFormatChange }: CompressPanelProps) {
  const { t, language } = useLanguage();
  const [quality, setQuality] = useState(100);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // 使用ref存储最新值，确保handleApply能读取到最新状态
  const maxWidthRef = useRef<number | undefined>(undefined);
  const maxHeightRef = useRef<number | undefined>(undefined);
  const formatRef = useRef<ExportFormat>(initialFormat);
  const qualityRef = useRef<number>(100);
  const originalImageRef = useRef<{ url: string; width: number; height: number } | null>(null);
  
  // 同步ref值
  useEffect(() => {
    maxWidthRef.current = maxWidth;
  }, [maxWidth]);
  
  useEffect(() => {
    maxHeightRef.current = maxHeight;
  }, [maxHeight]);
  
  useEffect(() => {
    formatRef.current = format;
  }, [format]);
  
  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);
  
  useEffect(() => {
    originalImageRef.current = { url: imageUrl, width: imageWidth, height: imageHeight };
  }, [imageUrl, imageWidth, imageHeight]);
  
  const handleApply = useCallback(async () => {
    if (!originalImageRef.current) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(originalImageRef.current.url);
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });
      
      // 使用ref中的最新值
      const imageFormat = formatRef.current as ImageFormat;
      const compressed = await compressImage(file, qualityRef.current, maxWidthRef.current, maxHeightRef.current, imageFormat);
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressed);
      });
      
      const img = await loadImage(compressed);
      onApply(dataUrl, img.width, img.height);
      toast.success(t('processing') + ' ' + formatFileSize(compressed.size));
    } catch (error) {
      toast.error('Compression failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onApply, t]);

  const handleFormatClick = useCallback((newFormat: ExportFormat) => {
    setFormat(newFormat);
    if (onFormatChange) {
      onFormatChange(newFormat);
    }
    // ref会同步更新，直接调用handleApply即可
    setTimeout(() => handleApply(), 0);
  }, [handleApply, onFormatChange]);

  const handleQualityChange = useCallback((newQuality: number) => {
    setQuality(newQuality);
  }, []);

  const handleQualityCommit = useCallback(() => {
    handleApply();
  }, [handleApply]);

  const handlePresetClick = useCallback((presetId: string, width: number, height: number) => {
    // 如果点击当前已选中的预设，则取消选中
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
      setMaxWidth(undefined);
      setMaxHeight(undefined);
    } else {
      setSelectedPreset(presetId);
      setMaxWidth(width);
      setMaxHeight(height);
    }
    setTimeout(() => handleApply(), 0);
  }, [selectedPreset, handleApply]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('targetFormat')}</label>
        <div className="grid grid-cols-3 gap-1">
          {exportFormats.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFormatClick(f.id)}
              disabled={isProcessing}
              className={cn(
                'px-2 py-2 rounded text-xs font-medium transition-all duration-200',
                format === f.id
                  ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50'
                  : 'bg-muted hover:bg-muted/80',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div>{f.name}</div>
              <div className="text-[10px] opacity-80">{f.extension}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('quality')}: {quality}%</label>
        <input
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={(e) => handleQualityChange(Number(e.target.value))}
          onMouseUp={handleQualityCommit}
          onTouchEnd={handleQualityCommit}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>低质量</span>
          <span>高质量</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{t('width')}</label>
          <input
            type="number"
            value={maxWidth || ''}
            onChange={(e) => {
              setMaxWidth(e.target.value ? Number(e.target.value) : undefined);
              setSelectedPreset(null);
            }}
            onBlur={handleQualityCommit}
            placeholder={String(imageWidth)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('height')}</label>
          <input
            type="number"
            value={maxHeight || ''}
            onChange={(e) => {
              setMaxHeight(e.target.value ? Number(e.target.value) : undefined);
              setSelectedPreset(null);
            }}
            onBlur={handleQualityCommit}
            placeholder={String(imageHeight)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">预设尺寸</label>
        <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-auto">
          {sizePresets.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id, preset.width, preset.height)}
              disabled={isProcessing}
              className={cn(
                'px-2 py-1.5 text-xs rounded text-left transition-all duration-200',
                selectedPreset === preset.id
                  ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50'
                  : 'bg-muted hover:bg-muted/80',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              {language === 'zh' ? preset.label : preset.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 text-sm">
        <div className="flex justify-between">
          <span>{t('originalSize')}:</span>
          <span>{formatFileSize(imageSize)}</span>
        </div>
      </div>
    </div>
  );
}
