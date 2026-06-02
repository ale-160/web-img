'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Moon, Sun, Download, Undo2, Redo2, Trash2, Globe, Shield, Edit2, Check, X, ChevronDown, History } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useImageEditor, ImageState } from '@/hooks/useImageEditor';
import { useHistoryStack } from '@/hooks/useHistoryStack';
import { UploadZone } from '@/components/ui/UploadZone';
import { ToolPanel, tabs } from '@/components/ui/ToolPanel';
import { CompressPanel } from '@/components/features/CompressPanel';
import { EditPanel } from '@/components/features/EditPanel';
import { WatermarkPanel } from '@/components/features/WatermarkPanel';
import { MergePanel } from '@/components/features/MergePanel';
import { ColorPanel } from '@/components/features/ColorPanel';
import { HistoryModal } from '@/components/ui/HistoryModal';
import { downloadFile, formatFileSize } from '@/utils/file';
import { ToolTab, exportFormats, ExportFormat } from '@/data/presets';
import {
  saveImageState,
  loadImageState,
  saveHistory,
  loadHistory,
  savePinned,
  loadPinned,
  addToHistory,
  ImageHistoryEntry
} from '@/utils/storage';

export default function HomePage() {
  const { t, toggleLanguage, isMounted: langMounted } = useLanguage();
  const { theme, toggleTheme, isMounted: themeMounted } = useTheme();
  const {
    originalImages,
    previewImage,
    addImages,
    removeImage,
    clearImages,
    updatePreview,
    updatePreviewName,
    resetPreview,
    getOriginalFormat
  } = useImageEditor();
  const { canUndo, canRedo, pushState, undo, redo, clear: clearHistoryStack } = useHistoryStack();
  const [activeTab, setActiveTab] = useState<ToolTab | null>(null);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editedFileName, setEditedFileName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('jpeg');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | File[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ImageHistoryEntry[]>([]);
  const [pinned, setPinned] = useState<ImageHistoryEntry[]>([]);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isMounted = langMounted && themeMounted;

  // 加载存储的状态
  useEffect(() => {
    if (isMounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const savedHistory = loadHistory();
      const savedPinned = loadPinned();

      setHistory(savedHistory);
      setPinned(savedPinned);
    }
  }, [langMounted, themeMounted, theme]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setShowFormatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // 全局拖拽事件处理，防止浏览器打开新标签页
    const handleGlobalDrag = (e: DragEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('dragover', handleGlobalDrag);
    window.addEventListener('drop', handleGlobalDrag);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      clearHistoryStack();
    }
  }, [previewImage, addImages, clearHistoryStack]);

  const handleConfirmUpload = useCallback(() => {
    if (pendingFiles) {
      clearImages();
      clearHistoryStack();
      addImages(pendingFiles);
    }
    setShowConfirmDialog(false);
    setPendingFiles(null);
  }, [pendingFiles, clearImages, clearHistoryStack, addImages]);

  const handleCancelUpload = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingFiles(null);
  }, []);

  const handleClearAll = useCallback(() => {
    clearImages();
    clearHistoryStack();
    setActiveTab(null);
  }, [clearImages, clearHistoryStack]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      updatePreview(state.imageData, state.width, state.height);
    } else if (originalImages.length > 0) {
      const original = originalImages[0];
      updatePreview(original.url, original.width, original.height);
    }
  }, [undo, updatePreview, originalImages]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      updatePreview(state.imageData, state.width, state.height);
    }
  }, [redo, updatePreview]);

  const handleReset = useCallback(() => {
    resetPreview();
    clearHistoryStack();
  }, [resetPreview, clearHistoryStack]);

  // 当有预览图片时，自动添加到历史（防抖）
  useEffect(() => {
    if (previewImage) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        const newEntry: ImageHistoryEntry = {
          id: Date.now().toString(),
          imageData: previewImage.url,
          width: previewImage.width,
          height: previewImage.height,
          name: previewImage.name,
          timestamp: Date.now(),
          originalFile: originalImages[0] ? {
            name: originalImages[0].name,
            size: originalImages[0].size,
            lastModified: originalImages[0].file.lastModified
          } : undefined
        };

        const { history: updatedHistory, pinned: updatedPinned } = addToHistory(newEntry, history, pinned);

        setHistory(updatedHistory);
        setPinned(updatedPinned);
        saveHistory(updatedHistory);
        savePinned(updatedPinned);
      }, 1000);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [previewImage?.url]); // 只依赖URL变化

  // 当添加图片后，设置selectedFormat为原图格式
  useEffect(() => {
    if (originalImages.length > 0) {
      const format = getOriginalFormat();
      if (format) {
        setSelectedFormat(format as ExportFormat);
      }
    }
  }, [originalImages.length, getOriginalFormat]);

  // 获取文件名（不含扩展名）
  const getFileNameWithoutExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  };

  // 下载时使用编辑后的文件名和选择的格式
  const handleDownload = useCallback(() => {
    if (!previewImage) return;
    const baseName = getFileNameWithoutExtension(previewImage.name);
    const formatInfo = exportFormats.find(f => f.id === selectedFormat);
    const finalName = `${baseName}${formatInfo?.extension || '.png'}`;
    downloadFile(previewImage.url, finalName);
    toast.success(t('download'));
  }, [previewImage, selectedFormat, t]);

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
      const formatInfo = exportFormats.find(f => f.id === selectedFormat);
      const fullName = `${editedFileName.trim()}${formatInfo?.extension || '.png'}`;
      updatePreviewName(fullName);
    }
    setIsEditingFileName(false);
  }, [editedFileName, selectedFormat, updatePreviewName]);

  const handleCancelEditFileName = useCallback(() => {
    setIsEditingFileName(false);
    if (previewImage) {
      setEditedFileName(getFileNameWithoutExtension(previewImage.name));
    }
  }, [previewImage]);

  const handleFormatSelect = useCallback((formatId: ExportFormat) => {
    setSelectedFormat(formatId);
    setShowFormatDropdown(false);
    // 更新预览文件名的扩展名
    if (previewImage) {
      const baseName = getFileNameWithoutExtension(previewImage.name);
      const formatInfo = exportFormats.find(f => f.id === formatId);
      const fullName = `${baseName}${formatInfo?.extension || '.png'}`;
      updatePreviewName(fullName);
    }
  }, [previewImage, updatePreviewName]);

  const handleRestoreVersion = useCallback((version: ImageHistoryEntry) => {
    updatePreview(version.imageData, version.width, version.height);
    updatePreviewName(version.name);
    setShowHistory(false);
    toast.success('已恢复');
  }, [updatePreview, updatePreviewName]);

  const handleTogglePin = useCallback((version: ImageHistoryEntry) => {
    if (version.pinned) {
      setPinned(prev => {
        const updated = prev.filter(item => item.id !== version.id);
        savePinned(updated);
        return updated;
      });
      setHistory(prev => {
        const updated = prev.map(item =>
          item.id === version.id ? { ...item, pinned: false } : item
        );
        saveHistory(updated);
        return updated;
      });
    } else {
      const pinnedItem = { ...version, pinned: true };
      setPinned(prev => {
        const updated = [pinnedItem, ...prev.filter(item => item.id !== version.id)];
        savePinned(updated);
        return updated;
      });
      setHistory(prev => {
        const updated = prev.map(item =>
          item.id === version.id ? pinnedItem : item
        );
        saveHistory(updated);
        return updated;
      });
    }
  }, []);

  const handleDeleteVersion = useCallback((versionId: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== versionId);
      saveHistory(updated);
      return updated;
    });
    setPinned(prev => {
      const updated = prev.filter(item => item.id !== versionId);
      savePinned(updated);
      return updated;
    });
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
            onClick={() => setShowHistory(true)}
            disabled={!hasImages}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="历史记录"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!hasImages}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('download')}
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleClearAll}
            disabled={!hasImages}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('clearAll')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
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
              {activeTab === 'compress' && currentOriginal && (
                <CompressPanel
                  imageUrl={currentOriginal.url}
                  imageWidth={currentOriginal.width}
                  imageHeight={currentOriginal.height}
                  imageSize={currentOriginal.size}
                  onApply={handleApply}
                  initialFormat={selectedFormat}
                  onFormatChange={(newFormat) => {
                    setSelectedFormat(newFormat);
                    if (currentOriginal) {
                      const baseName = getFileNameWithoutExtension(currentOriginal.name);
                      const formatInfo = exportFormats.find(f => f.id === newFormat);
                      const fullName = `${baseName}${formatInfo?.extension || '.png'}`;
                      updatePreviewName(fullName);
                    }
                  }}
                />
              )}
              {activeTab === 'edit' && currentOriginal && (
                <EditPanel
                  imageUrl={currentOriginal.url}
                  imageWidth={currentOriginal.width}
                  imageHeight={currentOriginal.height}
                  onApply={handleApply}
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
              {activeTab === 'color' && currentOriginal && (
                <ColorPanel
                  imageUrl={currentOriginal.url}
                  onApply={handleApply}
                />
              )}
              {activeTab && !['compress', 'edit', 'watermark', 'merge', 'color'].includes(activeTab) && !currentOriginal && (
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

          <div className="p-2 border-t border-border">
            <div className="flex gap-1">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title={t('undo')}
              >
                <Undo2 className="w-4 h-4" />
                <span>{t('undo')}</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title={t('redo')}
              >
                <span>{t('redo')}</span>
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleReset}
              disabled={!hasImages}
              className="w-full mt-1 py-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {t('reset')}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col border-r border-border min-w-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
              <span className="text-sm font-bold">{t('original')}</span>
              {currentOriginal && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {currentOriginal.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(currentOriginal.size)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-muted/10 scrollbar-thin">
              {currentOriginal ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={currentOriginal.url}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
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

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
              <span className="text-sm font-bold">{t('preview')}</span>
              {previewImage && (
                <div className="flex items-center gap-2">
                  {isEditingFileName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editedFileName}
                        onChange={(e) => setEditedFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveFileName();
                          if (e.key === 'Escape') handleCancelEditFileName();
                        }}
                        className="px-2 py-1 border border-border rounded text-xs bg-background w-32"
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
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
                  {/* 格式下拉框 */}
                  <div className="relative" ref={formatDropdownRef}>
                    <button
                      onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-xs"
                    >
                      <span>{exportFormats.find(f => f.id === selectedFormat)?.extension}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showFormatDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[100px]">
                        {exportFormats.map((format) => (
                          <button
                            key={format.id}
                            onClick={() => handleFormatSelect(format.id)}
                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-muted first:rounded-t-lg last:rounded-b-lg ${
                              selectedFormat === format.id ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            {format.extension}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {previewImage.width} × {previewImage.height}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-muted/10 scrollbar-thin">
              {previewImage ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewImage.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
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

      {/* 历史记录弹窗 */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        pinned={pinned}
        onRestore={handleRestoreVersion}
        onDelete={handleDeleteVersion}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
