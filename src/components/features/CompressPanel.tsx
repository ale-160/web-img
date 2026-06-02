'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { compressImage, ImageFormat, loadImage, ResizeMode } from '@/utils/canvas';
import { formatFileSize } from '@/utils/file';
import { sizePresets, exportFormats, ExportFormat, SizePreset } from '@/data/presets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Settings, Crop as CropIcon, Plus } from 'lucide-react';
import { PresetManagerModal } from '@/components/ui/PresetManagerModal';
import { CropModal } from '@/components/ui/CropModal';

interface CompressPanelProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  onApply: (imageData: string, width: number, height: number) => void;
}

export function CompressPanel({
  imageUrl,
  imageWidth,
  imageHeight,
  imageSize,
  onApply
}: CompressPanelProps) {
  const { language } = useLanguage();
  const [quality, setQuality] = useState(100);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('stretch');
  const [cropX, setCropX] = useState<number | undefined>(undefined);
  const [cropY, setCropY] = useState<number | undefined>(undefined);

  // 模态框状态
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // 本地预设管理
  const [localPresets, setLocalPresets] = useState<SizePreset[]>(sizePresets);

  // 获取固定的预设
  const fixedPresets = useMemo(() => {
    return localPresets.filter(p => p.fixed);
  }, [localPresets]);

  // 使用ref存储最新值
  const maxWidthRef = useRef<number | undefined>(undefined);
  const maxHeightRef = useRef<number | undefined>(undefined);
  const formatRef = useRef<ExportFormat>('jpeg');
  const qualityRef = useRef<number>(100);
  const resizeModeRef = useRef<ResizeMode>('stretch');
  const cropXRef = useRef<number | undefined>(undefined);
  const cropYRef = useRef<number | undefined>(undefined);
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
    resizeModeRef.current = resizeMode;
  }, [resizeMode]);

  useEffect(() => {
    cropXRef.current = cropX;
  }, [cropX]);

  useEffect(() => {
    cropYRef.current = cropY;
  }, [cropY]);

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
      const compressed = await compressImage(
        file,
        qualityRef.current,
        maxWidthRef.current,
        maxHeightRef.current,
        imageFormat,
        resizeModeRef.current,
        cropXRef.current,
        cropYRef.current
      );
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressed);
      });

      const img = await loadImage(compressed);
      onApply(dataUrl, img.width, img.height);
      toast.success(`处理完成 ${formatFileSize(compressed.size)}`);
    } catch (error) {
      toast.error('压缩失败');
    } finally {
      setIsProcessing(false);
    }
  }, [onApply]);

  const handleFormatClick = useCallback((newFormat: ExportFormat) => {
    setFormat(newFormat);
    setTimeout(() => handleApply(), 0);
  }, [handleApply]);

  const handlePresetClick = useCallback((preset: SizePreset) => {
    setSelectedPreset(preset.id);
    setMaxWidth(preset.width);
    setMaxHeight(preset.height);
    // 重置裁剪位置
    setCropX(undefined);
    setCropY(undefined);
    setShowCustomInput(false);
    setTimeout(() => handleApply(), 0);
  }, [handleApply]);

  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(Number(e.target.value));
  }, []);

  const handleQualityChangeEnd = useCallback(() => {
    setTimeout(() => handleApply(), 0);
  }, [handleApply]);

  const handleCustomClick = useCallback(() => {
    setShowCustomInput(true);
    setSelectedPreset(null);
    setCustomWidth('');
    setCustomHeight('');
  }, []);

  const handleCustomApply = useCallback(() => {
    setMaxWidth(customWidth ? Number(customWidth) : undefined);
    setMaxHeight(customHeight ? Number(customHeight) : undefined);
    setTimeout(() => handleApply(), 0);
  }, [customWidth, customHeight, handleApply]);

  const handleResizeModeClick = useCallback((mode: ResizeMode) => {
    setResizeMode(mode);
    if (mode === 'crop' && maxWidth && maxHeight) {
      setShowCropModal(true);
    } else {
      setTimeout(() => handleApply(), 0);
    }
  }, [handleApply, maxWidth, maxHeight]);

  // 裁剪回调
  const handleCropConfirm = useCallback((x: number, y: number) => {
    setCropX(x);
    setCropY(y);
    setTimeout(() => handleApply(), 0);
  }, [handleApply]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{language === 'zh' ? '目标格式' : 'Target Format'}</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {exportFormats.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFormatClick(f.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-all relative',
                format === f.id
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <div className="font-medium">{f.name}</div>
              <div className="text-xs opacity-70">{f.extension}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{language === 'zh' ? '预设尺寸' : 'Preset Size'}</label>
          <button
            onClick={() => setShowPresetManager(true)}
            className="p-1 rounded hover:bg-muted"
            title={language === 'zh' ? '管理预设' : 'Manage Presets'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {fixedPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-all relative',
                selectedPreset === preset.id
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <div className="font-medium">
                {language === 'zh' ? preset.name : preset.nameEn}
              </div>
              {preset.width && preset.height && (
                <div className="text-xs opacity-70">
                  {preset.width} × {preset.height}
                </div>
              )}
            </button>
          ))}
          {/* 自定义按钮 */}
          <button
            onClick={handleCustomClick}
            className={cn(
              'px-3 py-2 rounded-lg text-sm transition-all relative flex items-center gap-1',
              showCustomInput
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <Plus className="w-4 h-4" />
            {language === 'zh' ? '自定义' : 'Custom'}
          </button>
        </div>

        {/* 自定义尺寸输入框 */}
        {showCustomInput && (
          <div className="space-y-3 mb-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12 shrink-0">
                  {language === 'zh' ? '宽度' : 'Width'}
                </span>
                <input
                  type="number"
                  placeholder="1920"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12 shrink-0">
                  {language === 'zh' ? '高度' : 'Height'}
                </span>
                <input
                  type="number"
                  placeholder="1080"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleCustomApply}
              className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              {language === 'zh' ? '应用自定义尺寸' : 'Apply Custom Size'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-2 mt-4">
          <label className="text-sm font-medium">{language === 'zh' ? '调整方式' : 'Resize Mode'}</label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleResizeModeClick('stretch')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm transition-all relative',
              resizeMode === 'stretch'
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {language === 'zh' ? '拉伸' : 'Stretch'}
          </button>
          <button
            onClick={() => handleResizeModeClick('crop')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm transition-all relative flex items-center justify-center gap-1',
              resizeMode === 'crop'
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <CropIcon className="w-4 h-4" />
            {language === 'zh' ? '裁剪' : 'Crop'}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{language === 'zh' ? '压缩质量' : 'Quality'}</label>
          <span className="text-sm text-muted-foreground">{quality}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={handleQualityChange}
          onMouseUp={handleQualityChangeEnd}
          onTouchEnd={handleQualityChangeEnd}
          className="w-full"
        />
      </div>

      {/* 预设管理模态框 */}
      <PresetManagerModal
        isOpen={showPresetManager}
        onClose={() => setShowPresetManager(false)}
        presets={localPresets}
        onPresetsChange={setLocalPresets}
      />

      {/* 裁剪模态框 */}
      {showCropModal && maxWidth && maxHeight && (
        <CropModal
          isOpen={showCropModal}
          onClose={() => setShowCropModal(false)}
          imageUrl={imageUrl}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          cropWidth={maxWidth}
          cropHeight={maxHeight}
          onCrop={handleCropConfirm}
          initialX={cropX}
          initialY={cropY}
        />
      )}
    </div>
  );
}
