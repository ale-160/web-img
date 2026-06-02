'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { X, Pin, PinOff, ExternalLink } from 'lucide-react';
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
    onFormatsChange(formats.map(format => {
      if (format.id === id) {
        return { ...format, fixed: !format.fixed };
      }
      return format;
    }));
  }, [formats, onFormatsChange]);

  if (!isOpen) return null;

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
            {formats.map((format) => (
              <div key={format.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium">
                    {language === 'zh' ? format.name : format.nameEn}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format.extension}
                  </div>
                </div>
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
