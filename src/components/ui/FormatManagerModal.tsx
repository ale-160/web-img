'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { X, Pin, PinOff, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { FormatPreset } from '@/data/presets';

interface FormatManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  formats: FormatPreset[];
  onFormatsChange: (formats: FormatPreset[]) => void;
}

export function FormatManagerModal({ isOpen, onClose, formats, onFormatsChange }: FormatManagerModalProps) {
  const { language } = useLanguage();

  const handleToggleFixed = useCallback((id: string) => {
    const idx = formats.findIndex(f => f.id === id);
    if (idx === -1) return;
    const item = formats[idx];
    const newFixed = !item.fixed;
    const updated = [...formats];
    updated.splice(idx, 1);

    if (newFixed) {
      const lastFixedIdx = updated.findLastIndex((f: FormatPreset) => f.fixed);
      updated.splice(lastFixedIdx + 1, 0, { ...item, fixed: true });
    } else {
      const lastFixedIdx = updated.findLastIndex((f: FormatPreset) => f.fixed);
      updated.splice(lastFixedIdx + 1, 0, { ...item, fixed: false });
    }
    onFormatsChange(updated);
  }, [formats, onFormatsChange]);

  const handleMoveUp = useCallback((id: string) => {
    const idx = formats.findIndex(f => f.id === id);
    if (idx <= 0) return;
    const updated = [...formats];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    onFormatsChange(updated);
  }, [formats, onFormatsChange]);

  const handleMoveDown = useCallback((id: string) => {
    const idx = formats.findIndex(f => f.id === id);
    if (idx === -1 || idx >= formats.length - 1) return;
    const updated = [...formats];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    onFormatsChange(updated);
  }, [formats, onFormatsChange]);

  if (!isOpen) return null;

  // 排序显示：固定的在上
  const sortedFormats = [...formats].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold">
            {language === 'zh' ? '目标格式管理' : 'Format Manager'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1 min-h-0">
          <div className="space-y-2 mb-4">
            {sortedFormats.map((format, idx) => (
              <div key={format.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'zh' ? format.name : format.nameEn}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format.extension}
                  </div>
                </div>
                {/* 上移 */}
                <button
                  onClick={() => handleMoveUp(format.id)}
                  disabled={idx === 0}
                  className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  title={language === 'zh' ? '上移' : 'Move Up'}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                {/* 下移 */}
                <button
                  onClick={() => handleMoveDown(format.id)}
                  disabled={idx === sortedFormats.length - 1}
                  className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  title={language === 'zh' ? '下移' : 'Move Down'}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                {/* 固定 */}
                <button
                  onClick={() => handleToggleFixed(format.id)}
                  className={`p-2 rounded hover:bg-muted/70 ${format.fixed ? 'text-yellow-600' : ''}`}
                  title={language === 'zh' ? '固定/取消固定' : 'Pin/Unpin'}
                >
                  {format.fixed ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <a
              href="https://ale160.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {language === 'zh' ? '更多格式支持' : 'More format support'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
