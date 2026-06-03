'use client';

import { useState, useCallback, useEffect } from 'react';
import { Moon, Sun, Download, Trash2, Globe, Shield, Edit2, Check, X, RotateCcw, Maximize, Minimize, Eye, EyeOff, RotateCw, FlipHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useImageEditor } from '@/hooks/useImageEditor';
import { UploadZone } from '@/components/ui/UploadZone';
import { ToolPanel } from '@/components/ui/ToolPanel';
import { AdjustPanel } from '@/components/features/CompressPanel';
import { WatermarkPanel } from '@/components/features/WatermarkPanel';
import { MergePanel } from '@/components/features/MergePanel';
import { downloadFile, formatFileSize } from '@/utils/file';
import { ToolTab } from '@/data/presets';

export default function HomePage() {
  const { t, toggleLanguage, isMounted: langMounted } = useLanguage();
  const { theme, toggleTheme, isMounted: themeMounted } = useTheme();
  const {
    originalImages,
    previewImage,
    addImages,
    clearImages,
    updatePreview,
    updatePreviewName,
    resetPreview
  } = useImageEditor();
  const [activeTab, setActiveTab] = useState<ToolTab | null>(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editedFileName, setEditedFileName] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | File[] | null>(null);
  const [hideOriginal, setHideOriginal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const isMounted = langMounted && themeMounted;

  // 加载存储的状态
  useEffect(() => {
    if (isMounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [langMounted, themeMounted, theme]);

  // 全局拖拽事件处理，防止浏览器打开新标签页
  useEffect(() => {
    const handleGlobalDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleGlobalDrag);
    window.addEventListener('drop', handleGlobalDrag);

    return () => {
      window.removeEventListener('dragover', handleGlobalDrag);
      window.removeEventListener('drop', handleGlobalDrag);
    };
  }, []);


  // 添加图片后设置默认格式和添加到历史
  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    // 如果已有图片，显示确认弹窗
    if (previewImage) {
      setPendingFiles(files);
      setShowConfirmDialog(true);
    } else {
      addImages(files);
      setActiveTab('adjust'); // 自动跳转到调整
    }
  }, [previewImage, addImages]);

  const handleConfirmUpload = useCallback(() => {
    if (pendingFiles) {
      clearImages();
      addImages(pendingFiles);
      setActiveTab('adjust'); // 确认后自动跳转到调整
    }
    setShowConfirmDialog(false);
    setPendingFiles(null);
  }, [pendingFiles, clearImages, addImages]);

  const handleCancelUpload = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingFiles(null);
  }, []);

  const handleClearAll = useCallback(() => {
    clearImages();
  }, [clearImages]);

  const handleReset = useCallback(() => {
    resetPreview();
    setResetSignal(prev => prev + 1);
  }, [resetPreview]);

  // 获取文件名（不含扩展名）
  const getFileNameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  // 计算 dataURL 的大小
  const getDataUrlSize = (dataUrl: string) => {
    // dataURL 的大小大约是字节的 1.37 倍
    const base64 = dataUrl.split(',')[1];
    return base64 ? Math.ceil(base64.length * 0.75) : 0;
  };

  // 下载时使用编辑后的文件名
  const handleDownload = useCallback(() => {
    if (!previewImage) return;
    const baseName = getFileNameWithoutExtension(previewImage.name);
    downloadFile(previewImage.url, baseName);
    toast.success(t('download'));
  }, [previewImage, t]);

  const handleApply = useCallback((imageData: string, width: number, height: number) => {
    updatePreview(imageData, width, height);
  }, [updatePreview]);

  const handleToggleLanguage = useCallback(() => {
    toggleLanguage();
    toast.success('Language switched');
  }, [toggleLanguage]);

  const handleStartEditFileName = useCallback(() => {
    if (previewImage) {
      setEditedFileName(getFileNameWithoutExtension(previewImage.name));
      setIsEditingFileName(true);
    }
  }, [previewImage]);

  const handleSaveFileName = useCallback(() => {
    if (editedFileName.trim()) {
      updatePreviewName(editedFileName.trim());
    }
    setIsEditingFileName(false);
  }, [editedFileName, updatePreviewName]);

  const handleCancelEditFileName = useCallback(() => {
    setIsEditingFileName(false);
    if (previewImage) {
      setEditedFileName(getFileNameWithoutExtension(previewImage.name));
    }
  }, [previewImage]);

  const handleRotate = useCallback(async (angle: number) => {
    if (!previewImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = previewImage.url;
    await new Promise(resolve => img.onload = resolve);

    //旋转使用宽高对换为正常情况
    if (angle === 90 || angle === 270) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    updatePreview(canvas.toDataURL(), canvas.width, canvas.height);
    toast.success('旋转成功');
  }, [previewImage, updatePreview]);

  const handleFlip = useCallback(async () => {
    if (!previewImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = previewImage.url;
    await new Promise(resolve => img.onload = resolve);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);

    updatePreview(canvas.toDataURL(), canvas.width, canvas.height);
    toast.success('镜像成功');
  }, [previewImage, updatePreview]);

  // 切换隐藏原图
  const handleToggleHideOriginal = useCallback(() => {
    setHideOriginal(prev => !prev);
  }, []);

  // 切换全屏显示预览
  const handleToggleFullscreen = useCallback(() => {
    setShowFullscreenImage(prev => !prev);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const currentOriginal = originalImages[0];
  const hasImages = !!previewImage;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <a href="https://ale160.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {/*<img src="https://ale160.com/images/logo-icon.ico" alt="Logo" className="w-8 h-8 rounded" />*/}
            <span className="text-xl font-bold text-primary">{t('appName')}</span>
          </a>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleLanguage}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('language')}
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('theme')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-48 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="flex-1 overflow-auto">
            <ToolPanel activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'adjust' && currentOriginal && (
                <AdjustPanel
                  imageUrl={currentOriginal.url}
                  imageWidth={currentOriginal.width}
                  imageHeight={currentOriginal.height}
                  imageSize={currentOriginal.size}
                  onApply={handleApply}
                  resetSignal={resetSignal}
                />
              )}
              {activeTab === 'watermark' && currentOriginal && (
                <WatermarkPanel
                  imageUrl={currentOriginal.url}
                  imageWidth={currentOriginal.width}
                  imageHeight={currentOriginal.height}
                  onApply={handleApply}
                />
              )}
              {activeTab === 'merge' && currentOriginal && (
                <MergePanel
                  imageUrl={currentOriginal.url}
                  onApply={handleApply}
                />
              )}
              {activeTab && !['adjust', 'watermark', 'merge'].includes(activeTab) && !currentOriginal && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  请先上传图片
                </div>
              )}
              {!activeTab && currentOriginal && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  请选择功能
                </div>
              )}
            </ToolPanel>
          </div>
        </aside>

        <main className="flex-1 flex min-h-0">
          {!hideOriginal && (
            <>
              <div className="flex-1 flex flex-col border-r border-border min-w-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
                  <span className="text-sm font-bold">{t('original')}</span>
                </div>
                <div className="flex-1 overflow-auto bg-muted/10 scrollbar-thin">
                  {currentOriginal ? (
                    <div className="flex flex-col h-full p-4">
                      {/* 图片区域 - 固定高度，与预览区域一致 */}
                      <div className="h-96 flex items-center justify-center">
                        <img
                          src={currentOriginal.url}
                          alt="Original"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {/* 信息和按钮区域 - 固定在底部 */}
                      <div className="pt-4 flex items-center justify-center">
                        <div className="space-y-2 text-left">
                          <div className="text-sm font-medium">
                            原图名称：{currentOriginal.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            原图大小：{formatFileSize(currentOriginal.size)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            原图尺寸：{currentOriginal.width} × {currentOriginal.height}
                          </div>
                          {/* 清空按钮 */}
                          <div className="mt-3">
                            <button
                              onClick={handleClearAll}
                              disabled={!hasImages}
                              className="flex items-center justify-center gap-1 px-4 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              title={t('clearAll')}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{t('clearAll')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <div className="w-full max-w-md">
                        <UploadZone onFilesSelected={handleFilesSelected} hasExistingImage={false} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 中间分隔线 */}
              <div className="w-px bg-border self-stretch" />
            </>
          )}

          <div className={`flex flex-col min-w-0 ${hideOriginal ? 'flex-2' : 'flex-1'}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
              <span className="text-sm font-bold">{t('preview')}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleHideOriginal}
                  disabled={!hasImages}
                  className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={hideOriginal ? '显示原图' : '隐藏原图'}
                >
                  {hideOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleFullscreen}
                  disabled={!hasImages}
                  className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="全屏预览"
                >
                  {showFullscreenImage ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-muted/10 scrollbar-thin">
              {previewImage ? (
                <div className="flex flex-col h-full p-4">
                  {/* 图片区域 - 固定高度，隐藏原图时放大一倍 */}
                  <div className={`flex items-center justify-center ${hideOriginal ? 'h-192' : 'h-96'}`}>
                    <img
                      src={previewImage.url}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  {/* 信息和按钮区域 - 固定在底部 */}
                  <div className="pt-4 flex items-center justify-center">
                    <div className="space-y-2 text-left">
                      {isEditingFileName ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            预览名称：
                          </span>
                          <input
                            type="text"
                            value={editedFileName}
                            onChange={(e) => setEditedFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFileName();
                              if (e.key === 'Escape') handleCancelEditFileName();
                            }}
                            className="px-2 py-1 border border-border rounded text-sm bg-background w-32"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="保存"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelEditFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="取消"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            预览名称：
                          </span>
                          <span className="text-sm truncate max-w-50">
                            {getFileNameWithoutExtension(previewImage.name)}
                          </span>
                          <button
                            onClick={handleStartEditFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="编辑文件名"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        预览大小：{formatFileSize(getDataUrlSize(previewImage.url))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        预览尺寸：{previewImage.width} × {previewImage.height}
                      </div>
                      {/* 预览功能按钮 */}
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => handleRotate(90)}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title="旋转"
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>旋转</span>
                        </button>
                        <button
                          onClick={handleFlip}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title="镜像"
                        >
                          <FlipHorizontal className="w-4 h-4" />
                          <span>镜像</span>
                        </button>
                        <button
                          onClick={handleReset}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title={t('reset')}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('reset')}
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          title={t('download')}
                        >
                          <Download className="w-4 h-4" />
                          <span>{t('download')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t('noImage')}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="flex items-center justify-center gap-2 px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground shrink-0">
        <Shield className="w-3 h-3" />
        <span>{t('privacyNote')}</span>
      </footer>

      {/* 确认弹窗 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2">确认替换</h3>
            <p className="text-sm text-muted-foreground mb-4">
              是否清空工作区内容？当前已有的操作将不会保存。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全屏图片预览 */}
      {showFullscreenImage && previewImage && (
        <div
          className="fixed inset-0 z-1000 bg-black flex items-center justify-center cursor-pointer"
          onClick={() => setShowFullscreenImage(false)}
        >
          <img
            src={previewImage.url}
            alt="Fullscreen Preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullscreenImage(false)}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            title="关闭"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
