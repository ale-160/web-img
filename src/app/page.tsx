'use client';

import { useState, useCallback, useEffect } from 'react';
import { Moon, Sun, Download, Trash2, Globe, Shield, Edit2, Check, X, RotateCcw, Maximize, Minimize, Eye, EyeOff, RotateCw, FlipHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useImageEditor } from '@/hooks/useImageEditor';
import { UploadZone } from '@/components/ui/UploadZone';
import { ToolPanel } from '@/components/ui/ToolPanel';
import { SmallSidebar } from '@/components/ui/SmallSidebar';
import { AdjustPanel } from '@/components/features/CompressPanel';
import { WatermarkPanel } from '@/components/features/WatermarkPanel';
import { MergePanel } from '@/components/features/MergePanel';
import { downloadFile, formatFileSize } from '@/utils/file';
import type { ToolTab } from '@/data/presets';
import { cn } from '@/lib/utils';

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
  const [sidebarPinned, setSidebarPinned] = useState(false);

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

  // 侧边栏：有 tab 选中时自动展开
  const sidebarOpen = sidebarPinned || activeTab !== null;

  // 添加图片后设置默认格式和添加到历史
  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    if (previewImage) {
      setPendingFiles(files);
      setShowConfirmDialog(true);
    } else {
      addImages(files);
      setActiveTab('adjust');
    }
  }, [previewImage, addImages]);

  const handleConfirmUpload = useCallback(() => {
    if (pendingFiles) {
      clearImages();
      addImages(pendingFiles);
      setActiveTab('adjust');
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

  const getFileNameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  const getDataUrlSize = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    return base64 ? Math.ceil(base64.length * 0.75) : 0;
  };

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

  const handleToggleHideOriginal = useCallback(() => {
    setHideOriginal(prev => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setShowFullscreenImage(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab: ToolTab | null) => {
    setActiveTab(tab);
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
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0 z-10">
        <div className="flex items-center gap-3">
          <a href="https://ale160.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold text-primary tracking-tight">{t('appName')}</span>
          </a>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleLanguage}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={t('language')}
          >
            <Globe className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={t('theme')}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* 主内容区：双侧边栏 + 内容 */}
      <div className="flex flex-1 min-h-0">
        {/* 小型图标侧边栏 - WebStorm 风格 */}
        <SmallSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* 工具面板侧边栏 - 可展开/收起 */}
        {sidebarOpen && (
          <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200 ease-out">
            {/* 面板头部 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {activeTab === 'adjust' ? '图片调整' : activeTab === 'watermark' ? '水印处理' : activeTab === 'merge' ? '图片合并' : '工具面板'}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setSidebarPinned(!sidebarPinned)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    sidebarPinned
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  title={sidebarPinned ? '取消固定' : '固定面板'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setActiveTab(null); setSidebarPinned(false); }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="关闭面板"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 面板内容 */}
            <ToolPanel>
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
              {activeTab && !currentOriginal && (
                <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground text-sm gap-2">
                  <UploadZone onFilesSelected={handleFilesSelected} hasExistingImage={false} compact />
                </div>
              )}
            </ToolPanel>
          </aside>
        )}

        {/* 主内容区 */}
        <main className="flex-1 flex min-h-0">
          {/* 原图区域 */}
          {!hideOriginal && (
            <>
              <div className="flex-1 flex flex-col border-r border-border min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
                  <span className="text-sm font-semibold tracking-tight">{t('original')}</span>
                </div>
                <div className="flex-1 overflow-auto bg-muted/5 scrollbar-thin">
                  {currentOriginal ? (
                    <div className="flex flex-col h-full p-4">
                      <div className="h-96 flex items-center justify-center">
                        <img
                          src={currentOriginal.url}
                          alt="Original"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        />
                      </div>
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
                          <div className="mt-3">
                            <button
                              onClick={handleClearAll}
                              disabled={!hasImages}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
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

          {/* 预览区域 */}
          <div className={`flex flex-col min-w-0 ${hideOriginal ? 'flex-2' : 'flex-1'}`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
              <span className="text-sm font-semibold tracking-tight">{t('preview')}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleToggleHideOriginal}
                  disabled={!hasImages}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                  title={hideOriginal ? '显示原图' : '隐藏原图'}
                >
                  {hideOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleFullscreen}
                  disabled={!hasImages}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                  title="全屏预览"
                >
                  {showFullscreenImage ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-muted/5 scrollbar-thin">
              {previewImage ? (
                <div className="flex flex-col h-full p-4">
                  <div className={`flex items-center justify-center ${hideOriginal ? 'h-192' : 'h-96'}`}>
                    <img
                      src={previewImage.url}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                  <div className="pt-4 flex items-center justify-center">
                    <div className="space-y-2 text-left">
                      {isEditingFileName ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">预览名称：</span>
                          <input
                            type="text"
                            value={editedFileName}
                            onChange={(e) => setEditedFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFileName();
                              if (e.key === 'Escape') handleCancelEditFileName();
                            }}
                            className="px-2 py-1 border border-border rounded-lg text-sm bg-background w-32 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="保存"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEditFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="取消"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">预览名称：</span>
                          <span className="text-sm truncate max-w-50">
                            {getFileNameWithoutExtension(previewImage.name)}
                          </span>
                          <button
                            onClick={handleStartEditFileName}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="编辑文件名"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        预览大小：{formatFileSize(getDataUrlSize(previewImage.url))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        预览尺寸：{previewImage.width} × {previewImage.height}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => handleRotate(90)}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                          title="旋转"
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>旋转</span>
                        </button>
                        <button
                          onClick={handleFlip}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                          title="镜像"
                        >
                          <FlipHorizontal className="w-4 h-4" />
                          <span>镜像</span>
                        </button>
                        <button
                          onClick={handleReset}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                          title={t('reset')}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('reset')}
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={!hasImages}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors shadow-sm"
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

      <footer className="flex items-center justify-center gap-2 px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground shrink-0">
        <Shield className="w-3 h-3" />
        <span>{t('privacyNote')}</span>
      </footer>

      {/* 确认弹窗 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2">确认替换</h3>
            <p className="text-sm text-muted-foreground mb-4">
              是否清空工作区内容？当前已有的操作将不会保存。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors shadow-sm"
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
          className="fixed inset-0 z-1000 bg-black/95 flex items-center justify-center cursor-pointer"
          onClick={() => setShowFullscreenImage(false)}
        >
          <img
            src={previewImage.url}
            alt="Fullscreen Preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullscreenImage(false)}
            className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
