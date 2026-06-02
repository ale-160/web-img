'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { X, Plus, Trash2, Edit2, Check, Pin, PinOff } from 'lucide-react';
import { SizePreset } from '@/data/presets';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: SizePreset[];
  onPresetsChange: (presets: SizePreset[]) => void;
}

export function PresetManagerModal({ isOpen, onClose, presets, onPresetsChange }: PresetManagerModalProps) {
  const { t, language } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editWidth, setEditWidth] = useState<string>('');
  const [editHeight, setEditHeight] = useState<string>('');

  // 计算下一个新预设的编号
  const getNextPresetNumber = useCallback(() => {
    let maxNum = 0;
    presets.forEach(p => {
      const match = p.name.match(/新预设(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return maxNum + 1;
  }, [presets]);

  const handleAdd = useCallback(() => {
    const newId = Date.now().toString();
    const nextNum = getNextPresetNumber();
    const newPreset: SizePreset = {
      id: newId,
      name: `新预设${nextNum}`,
      nameEn: `New Preset ${nextNum}`,
      width: 1080,
      height: 1080,
      label: `新预设${nextNum}`,
      labelEn: `New Preset ${nextNum}`,
      fixed: false,
    };
    onPresetsChange([...presets, newPreset]);
    setEditingId(newId);
    setEditName(`新预设${nextNum}`);
    setEditNameEn(`New Preset ${nextNum}`);
    setEditWidth('1080');
    setEditHeight('1080');
  }, [presets, getNextPresetNumber, onPresetsChange]);

  const handleDelete = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset?.isDefaultPreset) return; // 系统默认预设不能删除
    onPresetsChange(presets.filter(p => p.id !== id));
  }, [presets, onPresetsChange]);

  const handleEdit = useCallback((preset: SizePreset) => {
    if (preset.isDefaultPreset) return; // 系统默认预设不能编辑
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditNameEn(preset.nameEn);
    setEditWidth(preset.width?.toString() || '');
    setEditHeight(preset.height?.toString() || '');
  }, []);

  const handleSave = useCallback((id: string) => {
    onPresetsChange(presets.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editName,
          nameEn: editNameEn,
          width: editWidth ? Number(editWidth) : undefined,
          height: editHeight ? Number(editHeight) : undefined,
          label: editName,
          labelEn: editNameEn,
        };
      }
      return p;
    }));
    setEditingId(null);
  }, [presets, editName, editNameEn, editWidth, editHeight, onPresetsChange]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleToggleFixed = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset?.isDefaultPreset) return; // 系统默认预设不能取消固定
    onPresetsChange(presets.map(p => {
      if (p.id === id) {
        return { ...p, fixed: !p.fixed };
      }
      return p;
    }));
  }, [presets, onPresetsChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold">
            {language === 'zh' ? '预设尺寸管理' : 'Preset Manager'}
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
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {editingId === preset.id ? (
                  <>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={language === 'zh' ? '预设名称' : 'Preset Name'}
                          className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                        <input
                          type="text"
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          placeholder="English"
                          className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16 shrink-0">
                            {language === 'zh' ? '宽度' : 'Width'}
                          </span>
                          <input
                            type="number"
                            value={editWidth}
                            onChange={(e) => setEditWidth(e.target.value)}
                            placeholder="1920"
                            className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16 shrink-0">
                            {language === 'zh' ? '高度' : 'Height'}
                          </span>
                          <input
                            type="number"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                            placeholder="1080"
                            className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSave(preset.id)}
                      className="p-2 rounded bg-primary text-primary-foreground"
                      disabled={preset.isDefaultPreset}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 rounded bg-muted hover:bg-muted/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-medium">
                        {language === 'zh' ? preset.name : preset.nameEn}
                        {preset.isDefaultPreset && (
                          <span className="ml-2 text-xs text-primary">
                            {language === 'zh' ? '(默认)' : '(Default)'}
                          </span>
                        )}
                      </div>
                      {preset.width && preset.height && (
                        <div className="text-sm text-muted-foreground">
                          {preset.width} × {preset.height}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleFixed(preset.id)}
                      className={`p-2 rounded hover:bg-muted/70 ${preset.fixed ? 'text-yellow-600' : ''} ${preset.isDefaultPreset ? 'cursor-not-allowed opacity-70' : ''}`}
                      disabled={preset.isDefaultPreset}
                    >
                      {preset.fixed ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                    </button>
                    {!preset.isDefaultPreset && (
                      <>
                        <button
                          onClick={() => handleEdit(preset)}
                          className="p-2 rounded hover:bg-muted"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(preset.id)}
                          className="p-2 rounded hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {language === 'zh' ? '添加预设' : 'Add Preset'}
          </button>
        </div>
      </div>
    </div>
  );
}
