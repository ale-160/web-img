'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { ImageHistoryEntry, getStorageInfo, formatSize } from '@/utils/storage';
import { Pin, PinOff, Trash2, Image as ImageIcon, X } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ImageHistoryEntry[];
  pinned: ImageHistoryEntry[];
  onRestore: (version: ImageHistoryEntry) => void;
  onDelete: (versionId: string) => void;
  onTogglePin: (version: ImageHistoryEntry) => void;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  history,
  pinned,
  onRestore,
  onDelete,
  onTogglePin,
}: HistoryModalProps) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return t('justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('minutesAgo')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t('hoursAgo')}`;
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  const getImageSize = (version: ImageHistoryEntry): string => {
    if (version.imageSize) {
      return formatSize(version.imageSize);
    }
    try {
      return formatSize(new Blob([version.imageData]).size);
    } catch {
      return '';
    }
  };

  const storageInfo = getStorageInfo(null, history, pinned);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {t('imageHistory')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 存储使用情况 */}
        <div className="p-4 border-b border-border bg-muted/30">
          <h4 className="text-sm font-medium mb-2">{t('storageUsage')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-muted p-2 rounded">
              <span className="text-muted-foreground">{t('total')}:</span>
              <span className="ml-1 font-mono">{formatSize(storageInfo.totalSize)}</span>
            </div>
            <div className="bg-muted p-2 rounded">
              <span className="text-muted-foreground">{t('preview')}:</span>
              <span className="ml-1 font-mono">{formatSize(storageInfo.previewSize)}</span>
            </div>
            <div className="bg-muted p-2 rounded">
              <span className="text-muted-foreground">{t('history')}:</span>
              <span className="ml-1 font-mono">{formatSize(storageInfo.historySize)}</span>
            </div>
            <div className="bg-muted p-2 rounded">
              <span className="text-muted-foreground">{t('pinned')}:</span>
              <span className="ml-1 font-mono">{formatSize(storageInfo.pinnedSize)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[65vh]">
          {history.length === 0 && pinned.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('noHistory')}
            </div>
          ) : (
            <div className="space-y-0">
              {/* 固定版本 */}
              {pinned.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0">
                    {t('pinnedImages')} ({pinned.length})
                  </div>
                  {pinned.map(version => (
                    <div
                      key={version.id}
                      className="p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 flex gap-3"
                          onClick={() => onRestore(version)}
                        >
                          <img
                            src={version.imageData}
                            alt={version.name}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{version.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {version.width} × {version.height}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ·
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {getImageSize(version)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatTime(version.timestamp)}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(version);
                            }}
                            className="p-1.5 rounded hover:bg-muted/70"
                            title={t('unpin')}
                          >
                            <PinOff className="w-4 h-4 text-yellow-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(version.id);
                            }}
                            className="p-1.5 rounded hover:bg-muted/70"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 普通版本 */}
              {history.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/20 text-xs font-medium text-muted-foreground sticky top-0">
                    {t('historyImages')} ({history.filter(item => !item.pinned).length})
                  </div>
                  {history.filter(item => !item.pinned).map(version => (
                    <div
                      key={version.id}
                      className="p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 flex gap-3"
                          onClick={() => onRestore(version)}
                        >
                          <img
                            src={version.imageData}
                            alt={version.name}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{version.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {version.width} × {version.height}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ·
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {getImageSize(version)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatTime(version.timestamp)}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(version);
                            }}
                            className="p-1.5 rounded hover:bg-muted/70"
                            title={t('pin')}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(version.id);
                            }}
                            className="p-1.5 rounded hover:bg-muted/70"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
